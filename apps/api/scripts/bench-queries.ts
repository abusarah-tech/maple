#!/usr/bin/env bun
// ---------------------------------------------------------------------------
// bench-queries.ts — ClickHouse query benchmarking CLI (Effect)
//
// Replays production SQL (captured on `WarehouseQueryService.executeSql` spans
// as `db.statement`) against a target ClickHouse and reports wall-time +
// ClickHouse server-side stats + EXPLAIN plans.
//
//   bun run scripts/bench-queries.ts fetch    [flags]   # mine traces → JSON
//   bun run scripts/bench-queries.ts run      <file>    # replay queries
//   bun run scripts/bench-queries.ts inspect  <file>    # EXPLAIN + PIPELINE
//   bun run scripts/bench-queries.ts compare  <a> <b>   # diff two runs
//
// Built with Effect v4 to match the rest of the codebase: config via `Config`,
// failures as `Schema.TaggedErrorClass`, HTTP/IO wrapped in `Context.Service`
// clients, orchestration in `Effect.gen`/`Effect.fn`. Env (read via `Config`):
//   TINYBIRD_HOST, TINYBIRD_TOKEN          — source (where prod traces live)
//   CLICKHOUSE_URL, CLICKHOUSE_USER,       — target (where we replay queries)
//     CLICKHOUSE_PASSWORD, CLICKHOUSE_DATABASE
//   MAPLE_INTERNAL_ORG_ID  (default: internal)
// ---------------------------------------------------------------------------

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { randomUUID } from "node:crypto"
import {
	Cause,
	Config,
	Console,
	Context,
	Duration,
	Effect,
	Exit,
	Layer,
	Option,
	Redacted,
	Schema,
} from "effect"
import { CH } from "@maple/query-engine"

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

class MissingConfigError extends Schema.TaggedErrorClass<MissingConfigError>()("MissingConfigError", {
	what: Schema.String,
	message: Schema.String,
}) {}

class HttpRequestError extends Schema.TaggedErrorClass<HttpRequestError>()("HttpRequestError", {
	url: Schema.String,
	message: Schema.String,
}) {}

class UpstreamStatusError extends Schema.TaggedErrorClass<UpstreamStatusError>()("UpstreamStatusError", {
	source: Schema.String,
	status: Schema.Number,
	message: Schema.String,
}) {}

class BenchFileError extends Schema.TaggedErrorClass<BenchFileError>()("BenchFileError", {
	path: Schema.String,
	op: Schema.String,
	message: Schema.String,
}) {}

class ArgsError extends Schema.TaggedErrorClass<ArgsError>()("ArgsError", {
	message: Schema.String,
}) {}

// ---------------------------------------------------------------------------
// Internal data shapes (typed JSON; not branded — local dev tool)
// ---------------------------------------------------------------------------

interface Sample {
	readonly fingerprint: string
	readonly context: string
	readonly profile: string
	readonly sampleSql: string
	readonly sampleCount: number
	readonly p50DurationMs: number
	readonly p95DurationMs: number
	readonly p99DurationMs: number
	readonly maxDurationMs: number
}

interface FetchOutput {
	readonly fetchedAt: string
	readonly source: string
	readonly criteria: {
		readonly orgId: string
		readonly startTime: string
		readonly endTime: string
		readonly contextFilter?: string
		readonly profileFilter?: string
		readonly topN: number
	}
	readonly samples: ReadonlyArray<Sample>
}

interface RunMetrics {
	readonly wallMs: number
	readonly serverElapsedMs: number | null
	readonly readRows: number | null
	readonly readBytes: number | null
	readonly memoryUsage: number | null
}

interface SampleResult {
	readonly fingerprint: string
	readonly context: string
	readonly profile: string
	readonly runs: ReadonlyArray<RunMetrics>
	readonly aggregates: {
		readonly p50WallMs: number
		readonly p95WallMs: number
		readonly p99WallMs: number
		readonly meanServerMs: number | null
		readonly meanReadRows: number | null
		readonly meanReadBytes: number | null
		readonly meanMemoryUsage: number | null
	}
	readonly error?: string
}

interface RunOutput {
	readonly ranAt: string
	readonly target: string
	readonly sourceFile: string
	readonly runsPerQuery: number
	readonly warmupRuns: number
	readonly results: ReadonlyArray<SampleResult>
}

interface ChResult {
	readonly status: number
	readonly body: string
	readonly queryId: string
	readonly wallMs: number
	readonly summary: Option.Option<Record<string, string>>
}

interface QueryLogEntry {
	readonly memoryUsage: number
	readonly queryDurationMs: number
	readonly readRows: number
	readonly readBytes: number
}

// ---------------------------------------------------------------------------
// BenchConfig — resolve warehouse credentials from the environment via `Config`
// ---------------------------------------------------------------------------

interface ClickHouseConfig {
	readonly url: string
	readonly user: string
	readonly password: string
	readonly database: string
}

interface TinybirdConfig {
	readonly host: string
	readonly token: string
	readonly internalOrgId: string
}

interface BenchConfigShape {
	readonly clickhouse: Option.Option<ClickHouseConfig>
	readonly tinybird: Option.Option<TinybirdConfig>
}

const stripTrailingSlash = (s: string) => s.replace(/\/+$/, "")

export class BenchConfig extends Context.Service<BenchConfig, BenchConfigShape>()("bench/BenchConfig", {
	make: Effect.gen(function* () {
		const chUrl = yield* Config.option(Config.string("CLICKHOUSE_URL"))
		const chUser = yield* Config.string("CLICKHOUSE_USER").pipe(Config.withDefault("default"))
		const chDatabase = yield* Config.string("CLICKHOUSE_DATABASE").pipe(Config.withDefault("default"))
		const chPassword = yield* Config.option(Config.redacted("CLICKHOUSE_PASSWORD"))
		const tbHost = yield* Config.option(Config.string("TINYBIRD_HOST"))
		const tbToken = yield* Config.option(Config.redacted("TINYBIRD_TOKEN"))
		const internalOrgId = yield* Config.string("MAPLE_INTERNAL_ORG_ID").pipe(
			Config.withDefault("internal"),
		)

		const clickhouse = Option.map(chUrl, (url) => ({
			url: stripTrailingSlash(url),
			user: chUser,
			database: chDatabase,
			password: Option.match(chPassword, { onNone: () => "", onSome: Redacted.value }),
		}))

		const tinybird = Option.zipWith(tbHost, tbToken, (host, token) => ({
			host: stripTrailingSlash(host),
			token: Redacted.value(token),
			internalOrgId,
		}))

		return { clickhouse, tinybird } satisfies BenchConfigShape
	}),
}) {
	static readonly layer = Layer.effect(this, this.make)
}

// ---------------------------------------------------------------------------
// ClickHouse client — raw HTTP so we can read X-ClickHouse-Summary + query_id
// ---------------------------------------------------------------------------

const parseSummaryHeader = (value: string | null): Option.Option<Record<string, string>> => {
	if (!value) return Option.none()
	try {
		return Option.some(JSON.parse(value) as Record<string, string>)
	} catch {
		return Option.none()
	}
}

interface ClickHouseShape {
	readonly run: (
		sql: string,
		opts?: { readonly queryId?: string },
	) => Effect.Effect<ChResult, HttpRequestError | MissingConfigError>
	readonly queryLog: (queryId: string) => Effect.Effect<Option.Option<QueryLogEntry>, MissingConfigError>
}

export class ClickHouse extends Context.Service<ClickHouse, ClickHouseShape>()("bench/ClickHouse", {
	make: Effect.gen(function* () {
		const { clickhouse } = yield* BenchConfig

		const requireConfig = Option.match(clickhouse, {
			onNone: () =>
				Effect.fail(
					new MissingConfigError({
						what: "CLICKHOUSE_URL",
						message:
							"CLICKHOUSE_URL is required to replay queries — point it at the target cluster " +
							"(local, staging, or a BYO cluster). Tinybird's SQL endpoint can't expose " +
							"query_id / system.query_log.",
					}),
				),
			onSome: (cfg) => Effect.succeed(cfg),
		})

		const authHeader = (cfg: ClickHouseConfig) =>
			`Basic ${Buffer.from(`${cfg.user}:${cfg.password}`).toString("base64")}`

		const run = Effect.fn("ClickHouse.run")(function* (
			sql: string,
			opts?: { readonly queryId?: string },
		) {
			const cfg = yield* requireConfig
			const queryId = opts?.queryId ?? randomUUID()
			const url = new URL(cfg.url)
			url.searchParams.set("database", cfg.database)
			url.searchParams.set("query_id", queryId)
			url.searchParams.set("wait_end_of_query", "1")

			const start = performance.now()
			const response = yield* Effect.tryPromise({
				try: (signal) =>
					fetch(url, {
						method: "POST",
						headers: { Authorization: authHeader(cfg), "Content-Type": "text/plain; charset=utf-8" },
						body: sql,
						signal,
					}),
				catch: (cause) => new HttpRequestError({ url: cfg.url, message: String(cause) }),
			})
			const body = yield* Effect.tryPromise({
				try: () => response.text(),
				catch: (cause) => new HttpRequestError({ url: cfg.url, message: String(cause) }),
			})
			const wallMs = performance.now() - start

			return {
				status: response.status,
				body,
				queryId,
				wallMs,
				summary: parseSummaryHeader(response.headers.get("x-clickhouse-summary")),
			} satisfies ChResult
		})

		// system.query_log is buffered (~7s flush). Poll a few times with backoff,
		// then give up and let the caller fall back to the summary header.
		const queryLog = Effect.fn("ClickHouse.queryLog")(function* (queryId: string) {
			const sql =
				`SELECT memory_usage, query_duration_ms, read_rows, read_bytes ` +
				`FROM system.query_log ` +
				`WHERE query_id = '${queryId}' AND type = 'QueryFinish' ` +
				`ORDER BY event_time DESC LIMIT 1 FORMAT JSONEachRow`

			for (const delayMs of [500, 1500, 3000, 5000]) {
				yield* Effect.sleep(Duration.millis(delayMs))
				const result = yield* run(sql).pipe(
					Effect.match({ onFailure: () => null, onSuccess: (r) => r }),
				)
				if (!result || result.status !== 200) continue
				const line = result.body.trim().split("\n")[0]
				if (!line) continue
				const parsed = yield* Effect.try({
					try: () => JSON.parse(line) as Record<string, unknown>,
					catch: () => null,
				}).pipe(Effect.match({ onFailure: () => null, onSuccess: (p) => p }))
				if (!parsed) continue
				return Option.some({
					memoryUsage: Number(parsed.memory_usage ?? 0),
					queryDurationMs: Number(parsed.query_duration_ms ?? 0),
					readRows: Number(parsed.read_rows ?? 0),
					readBytes: Number(parsed.read_bytes ?? 0),
				} satisfies QueryLogEntry)
			}
			return Option.none<QueryLogEntry>()
		})

		return { run, queryLog } satisfies ClickHouseShape
	}),
}) {
	static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(BenchConfig.layer))
}

// ---------------------------------------------------------------------------
// Tinybird client — source for mining db.statement spans
// ---------------------------------------------------------------------------

interface TinybirdShape {
	readonly query: (
		sql: string,
	) => Effect.Effect<
		ReadonlyArray<Record<string, unknown>>,
		HttpRequestError | UpstreamStatusError | MissingConfigError
	>
	readonly host: Effect.Effect<string, MissingConfigError>
	readonly internalOrgId: Effect.Effect<string, MissingConfigError>
}

export class Tinybird extends Context.Service<Tinybird, TinybirdShape>()("bench/Tinybird", {
	make: Effect.gen(function* () {
		const { tinybird } = yield* BenchConfig

		const requireConfig = Option.match(tinybird, {
			onNone: () =>
				Effect.fail(
					new MissingConfigError({
						what: "TINYBIRD_HOST/TINYBIRD_TOKEN",
						message:
							"TINYBIRD_HOST and TINYBIRD_TOKEN are required to mine recent db.statement spans " +
							"from production traces.",
					}),
				),
			onSome: (cfg) => Effect.succeed(cfg),
		})

		const query = Effect.fn("Tinybird.query")(function* (sql: string) {
			const cfg = yield* requireConfig
			const url = `${cfg.host}/v0/sql?q=${encodeURIComponent(sql)}`
			const response = yield* Effect.tryPromise({
				try: (signal) => fetch(url, { headers: { Authorization: `Bearer ${cfg.token}` }, signal }),
				catch: (cause) => new HttpRequestError({ url: cfg.host, message: String(cause) }),
			})
			const text = yield* Effect.tryPromise({
				try: () => response.text(),
				catch: (cause) => new HttpRequestError({ url: cfg.host, message: String(cause) }),
			})
			if (!response.ok) {
				return yield* Effect.fail(
					new UpstreamStatusError({ source: "Tinybird", status: response.status, message: text.slice(0, 500) }),
				)
			}
			const parsed = JSON.parse(text) as { data: ReadonlyArray<Record<string, unknown>> }
			return parsed.data
		})

		return {
			query,
			host: requireConfig.pipe(Effect.map((c) => c.host)),
			internalOrgId: requireConfig.pipe(Effect.map((c) => c.internalOrgId)),
		} satisfies TinybirdShape
	}),
}) {
	static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(BenchConfig.layer))
}

// ---------------------------------------------------------------------------
// File IO (wrapped in Effect)
// ---------------------------------------------------------------------------

const readJsonFile = <T>(path: string) =>
	Effect.tryPromise({
		try: () => readFile(path, "utf-8"),
		catch: (cause) => new BenchFileError({ path, op: "read", message: String(cause) }),
	}).pipe(
		Effect.flatMap((text) =>
			Effect.try({
				try: () => JSON.parse(text) as T,
				catch: (cause) => new BenchFileError({ path, op: "parse", message: String(cause) }),
			}),
		),
	)

const writeJsonFile = (path: string, value: unknown) =>
	Effect.tryPromise({
		try: async () => {
			await mkdir(dirname(resolve(path)), { recursive: true })
			await writeFile(path, JSON.stringify(value, null, 2))
		},
		catch: (cause) => new BenchFileError({ path, op: "write", message: String(cause) }),
	})

// ---------------------------------------------------------------------------
// Pure helpers — time, formatting, stats, table
// ---------------------------------------------------------------------------

const parseRelativeDuration = (input: string): Effect.Effect<number, ArgsError> => {
	const match = /^(\d+)\s*(s|m|h|d)$/i.exec(input.trim())
	if (!match) {
		return Effect.fail(
			new ArgsError({ message: `Invalid duration "${input}". Expected NNs / NNm / NNh / NNd (e.g. 24h, 7d).` }),
		)
	}
	const unit = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]!.toLowerCase()]!
	return Effect.succeed(Number(match[1]) * unit)
}

const formatCHDateTime = (d: Date): string => {
	const pad = (n: number) => String(n).padStart(2, "0")
	return (
		`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
		`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
	)
}

const formatMs = (ms: number | null | undefined): string => {
	if (ms == null || Number.isNaN(ms)) return "—"
	if (ms < 1) return `${ms.toFixed(2)}ms`
	if (ms < 1000) return `${Math.round(ms)}ms`
	if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`
	return `${Math.floor(ms / 60_000)}m${Math.round((ms % 60_000) / 1000)}s`
}

const formatRows = (n: number | null | undefined): string => {
	if (n == null || Number.isNaN(n)) return "—"
	if (n < 1_000) return String(n)
	if (n < 1_000_000) return `${(n / 1_000).toFixed(1)}K`
	if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(1)}M`
	return `${(n / 1_000_000_000).toFixed(2)}B`
}

const formatBytes = (n: number | null | undefined): string => {
	if (n == null || Number.isNaN(n)) return "—"
	if (n < 1024) return `${n}B`
	if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)}KB`
	if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)}MB`
	return `${(n / 1024 ** 3).toFixed(2)}GB`
}

const formatMemoryMB = (bytes: number | null | undefined): string =>
	bytes == null || Number.isNaN(bytes) ? "—" : `${(bytes / 1024 / 1024).toFixed(1)}MB`

const formatDelta = (a: number | null, b: number | null, kind: "ms" | "rows" | "bytes"): string => {
	if (a == null || b == null || Number.isNaN(a) || Number.isNaN(b)) return "—"
	const delta = b - a
	const pct = a === 0 ? 0 : (delta / a) * 100
	const sign = delta > 0 ? "+" : ""
	const fmt = kind === "ms" ? formatMs : kind === "rows" ? formatRows : formatBytes
	return `${sign}${fmt(delta)} (${sign}${pct.toFixed(1)}%)`
}

const truncate = (s: string, n: number): string => (s.length <= n ? s : `${s.slice(0, n - 1)}…`)

const percentile = (values: ReadonlyArray<number>, p: number): number => {
	if (values.length === 0) return Number.NaN
	const sorted = [...values].sort((a, b) => a - b)
	return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]!
}

const mean = (values: ReadonlyArray<number | null>): number | null => {
	const finite = values.filter((v): v is number => v != null && Number.isFinite(v))
	return finite.length === 0 ? null : finite.reduce((a, b) => a + b, 0) / finite.length
}

interface Column {
	readonly header: string
	readonly width: number
	readonly align?: "right"
}

const renderTable = (title: string, columns: ReadonlyArray<Column>, rows: ReadonlyArray<ReadonlyArray<string>>): string => {
	const pad = (value: string, col: Column) => {
		const t = truncate(value, col.width)
		return col.align === "right" ? t.padStart(col.width) : t.padEnd(col.width)
	}
	const innerWidth = columns.reduce((sum, c) => sum + c.width, 0) + (columns.length - 1) * 3
	const border = "─".repeat(innerWidth + 2)
	const titleLine = ` ${title} `
	const titleBorderRight = "─".repeat(Math.max(0, innerWidth + 2 - titleLine.length - 2))
	const lines: string[] = []
	lines.push(`┌─${titleLine}${titleBorderRight}┐`)
	lines.push(`│ ${columns.map((c) => pad(c.header, c)).join(" │ ")} │`)
	lines.push(`├${border}┤`)
	for (const row of rows) lines.push(`│ ${row.map((v, i) => pad(v, columns[i]!)).join(" │ ")} │`)
	lines.push(`└${border}┘`)
	return lines.join("\n")
}

// ---------------------------------------------------------------------------
// Args — tiny flag parser, errors surface through the Effect channel
// ---------------------------------------------------------------------------

interface FlagSpec {
	readonly string?: ReadonlyArray<string>
	readonly number?: ReadonlyArray<string>
}

const parseFlags = (
	argv: ReadonlyArray<string>,
	spec: FlagSpec,
): Effect.Effect<Record<string, string | number | undefined>, ArgsError> =>
	Effect.gen(function* () {
		const result: Record<string, string | number | undefined> = {}
		for (let i = 0; i < argv.length; i++) {
			const arg = argv[i]!
			if (!arg.startsWith("--")) continue
			const key = arg.slice(2)
			const value = argv[++i]
			if (value === undefined) return yield* Effect.fail(new ArgsError({ message: `Flag --${key} requires a value.` }))
			if (spec.number?.includes(key)) {
				const n = Number(value)
				if (Number.isNaN(n)) return yield* Effect.fail(new ArgsError({ message: `Flag --${key} expects a number, got "${value}".` }))
				result[key] = n
			} else if (spec.string?.includes(key)) {
				result[key] = value
			} else {
				return yield* Effect.fail(new ArgsError({ message: `Unknown flag: --${key}` }))
			}
		}
		return result
	})

const timestampSlug = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)

// ---------------------------------------------------------------------------
// Subcommand: fetch
// ---------------------------------------------------------------------------

const fetchCmd = Effect.fn("bench.fetch")(function* (args: ReadonlyArray<string>) {
	const tinybird = yield* Tinybird
	const flags = yield* parseFlags(args, {
		string: ["context", "profile", "since", "out", "org"],
		number: ["top"],
	})

	const sinceMs = yield* parseRelativeDuration((flags.since as string) ?? "24h")
	const now = new Date()
	const startTime = formatCHDateTime(new Date(now.getTime() - sinceMs))
	const endTime = formatCHDateTime(now)
	const topN = (flags.top as number | undefined) ?? 20
	const orgId = (flags.org as string | undefined) ?? (yield* tinybird.internalOrgId)
	const host = yield* tinybird.host

	const compiled = CH.compile(
		CH.dbStatementSamplesQuery({
			contextFilter: flags.context as string | undefined,
			profileFilter: flags.profile as string | undefined,
			limit: topN,
		}),
		{ orgId, startTime, endTime },
	)

	yield* Console.log(`Mining db.statement spans from ${host}`)
	yield* Console.log(`  org: ${orgId}   window: ${startTime} → ${endTime} (${flags.since ?? "24h"})   top: ${topN}`)

	const rows = yield* tinybird.query(compiled.sql)
	const samples = compiled.castRows(rows) as ReadonlyArray<Sample>

	if (samples.length === 0) {
		yield* Console.log("No samples found. Widen --since or drop filters.")
		return
	}

	const outputPath = (flags.out as string | undefined) ?? `apps/api/scripts/.bench/queries-${timestampSlug()}.json`
	const output: FetchOutput = {
		fetchedAt: now.toISOString(),
		source: host,
		criteria: {
			orgId,
			startTime,
			endTime,
			contextFilter: flags.context as string | undefined,
			profileFilter: flags.profile as string | undefined,
			topN,
		},
		samples,
	}
	yield* writeJsonFile(outputPath, output)

	yield* Console.log(
		renderTable(
			`Top ${samples.length} queries by p95 duration`,
			[
				{ header: "context", width: 28 },
				{ header: "profile", width: 12 },
				{ header: "fingerprint", width: 16 },
				{ header: "count", width: 8, align: "right" },
				{ header: "p50", width: 8, align: "right" },
				{ header: "p95", width: 8, align: "right" },
				{ header: "p99", width: 8, align: "right" },
			],
			samples.map((s) => [
				s.context || "—",
				s.profile || "—",
				s.fingerprint,
				formatRows(s.sampleCount),
				formatMs(s.p50DurationMs),
				formatMs(s.p95DurationMs),
				formatMs(s.p99DurationMs),
			]),
		),
	)
	yield* Console.log(`\nWrote ${outputPath}`)
})

// ---------------------------------------------------------------------------
// Subcommand: run
// ---------------------------------------------------------------------------

const stripTrailingSemi = (sql: string) => sql.replace(/;\s*$/, "")

const benchmarkSample = Effect.fn("bench.sample")(function* (
	ch: ClickHouseShape,
	sample: Sample,
	runsPerQuery: number,
	warmupRuns: number,
) {
	const replaySql = stripTrailingSemi(sample.sampleSql)

	const result = yield* Effect.gen(function* () {
		for (let w = 0; w < warmupRuns; w++) {
			const warm = yield* ch.run(replaySql)
			if (warm.status !== 200) {
				return yield* Effect.fail(
					new UpstreamStatusError({ source: "ClickHouse", status: warm.status, message: warm.body.slice(0, 200) }),
				)
			}
		}

		const runs: RunMetrics[] = []
		for (let r = 0; r < runsPerQuery; r++) {
			const res = yield* ch.run(replaySql)
			if (res.status !== 200) {
				return yield* Effect.fail(
					new UpstreamStatusError({ source: "ClickHouse", status: res.status, message: res.body.slice(0, 200) }),
				)
			}
			const log = yield* ch.queryLog(res.queryId)
			const summary = res.summary
			const fromSummary = (key: string) =>
				Option.match(summary, {
					onNone: () => null,
					onSome: (s) => (s[key] !== undefined ? Number(s[key]) : null),
				})
			runs.push({
				wallMs: res.wallMs,
				serverElapsedMs: Option.match(log, {
					onNone: () => {
						const ns = fromSummary("elapsed_ns")
						return ns == null ? null : ns / 1e6
					},
					onSome: (l) => l.queryDurationMs,
				}),
				readRows: Option.match(log, { onNone: () => fromSummary("read_rows"), onSome: (l) => l.readRows }),
				readBytes: Option.match(log, { onNone: () => fromSummary("read_bytes"), onSome: (l) => l.readBytes }),
				memoryUsage: Option.match(log, { onNone: () => null, onSome: (l) => l.memoryUsage }),
			})
		}

		const wallValues = runs.map((r) => r.wallMs)
		return {
			fingerprint: sample.fingerprint,
			context: sample.context,
			profile: sample.profile,
			runs,
			aggregates: {
				p50WallMs: percentile(wallValues, 50),
				p95WallMs: percentile(wallValues, 95),
				p99WallMs: percentile(wallValues, 99),
				meanServerMs: mean(runs.map((r) => r.serverElapsedMs)),
				meanReadRows: mean(runs.map((r) => r.readRows)),
				meanReadBytes: mean(runs.map((r) => r.readBytes)),
				meanMemoryUsage: mean(runs.map((r) => r.memoryUsage)),
			},
		} satisfies SampleResult
	}).pipe(
		// A single bad query shouldn't abort the whole sweep — record and move on.
		Effect.catchTags({
			HttpRequestError: (err) => Effect.succeed(failedResult(sample, err.message)),
			UpstreamStatusError: (err) => Effect.succeed(failedResult(sample, `status ${err.status}: ${err.message}`)),
			MissingConfigError: (err) => Effect.fail(err),
		}),
	)

	yield* Console.log(
		`  ${truncate(`${sample.context}@${sample.fingerprint}`, 50).padEnd(50)} ` +
			(result.error ? `FAILED — ${truncate(result.error, 60)}` : `p95 ${formatMs(result.aggregates.p95WallMs)}`),
	)
	return result
})

const failedResult = (sample: Sample, message: string): SampleResult => ({
	fingerprint: sample.fingerprint,
	context: sample.context,
	profile: sample.profile,
	runs: [],
	aggregates: {
		p50WallMs: Number.NaN,
		p95WallMs: Number.NaN,
		p99WallMs: Number.NaN,
		meanServerMs: null,
		meanReadRows: null,
		meanReadBytes: null,
		meanMemoryUsage: null,
	},
	error: message,
})

const runCmd = Effect.fn("bench.run")(function* (args: ReadonlyArray<string>) {
	const ch = yield* ClickHouse
	const [filePath, ...rest] = args
	if (!filePath) {
		return yield* Effect.fail(
			new ArgsError({ message: "Usage: bench-queries.ts run <file> [--runs N] [--warmup N] [--out path]" }),
		)
	}
	const flags = yield* parseFlags(rest, { string: ["out"], number: ["runs", "warmup"] })
	const runsPerQuery = (flags.runs as number | undefined) ?? 5
	const warmupRuns = (flags.warmup as number | undefined) ?? 1

	const fetchOutput = yield* readJsonFile<FetchOutput>(filePath)

	yield* Console.log(`Replaying ${fetchOutput.samples.length} queries (${runsPerQuery} runs each, warmup ${warmupRuns})`)
	yield* Console.log(`  source: ${filePath}\n`)

	// Sequential on purpose: concurrent replays would distort per-query timings.
	const results = yield* Effect.forEach(fetchOutput.samples, (sample) =>
		benchmarkSample(ch, sample, runsPerQuery, warmupRuns),
	)

	yield* Console.log(
		"\n" +
			renderTable(
				`Replay results (${runsPerQuery} runs each, warmup ${warmupRuns})`,
				[
					{ header: "context", width: 26 },
					{ header: "fingerprint", width: 14 },
					{ header: "p95 wall", width: 10, align: "right" },
					{ header: "ch elapsed", width: 10, align: "right" },
					{ header: "read rows", width: 10, align: "right" },
					{ header: "read bytes", width: 11, align: "right" },
					{ header: "mem", width: 9, align: "right" },
				],
				results.map((r) => [
					r.error ? `${r.context} (err)` : r.context || "—",
					r.fingerprint,
					formatMs(r.aggregates.p95WallMs),
					formatMs(r.aggregates.meanServerMs),
					formatRows(r.aggregates.meanReadRows),
					formatBytes(r.aggregates.meanReadBytes),
					formatMemoryMB(r.aggregates.meanMemoryUsage),
				]),
			),
	)

	const outputPath = (flags.out as string | undefined) ?? `apps/api/scripts/.bench/results-${timestampSlug()}.json`
	const runOutput: RunOutput = {
		ranAt: new Date().toISOString(),
		target: fetchOutput.source,
		sourceFile: filePath,
		runsPerQuery,
		warmupRuns,
		results,
	}
	yield* writeJsonFile(outputPath, runOutput)
	yield* Console.log(`\nWrote ${outputPath}`)
})

// ---------------------------------------------------------------------------
// Subcommand: inspect
// ---------------------------------------------------------------------------

const stripFormatClause = (sql: string) =>
	sql.replace(/\s+FORMAT\s+\w+\s*;?\s*$/i, "").replace(/;\s*$/, "")

const inspectCmd = Effect.fn("bench.inspect")(function* (args: ReadonlyArray<string>) {
	const ch = yield* ClickHouse
	const [filePath] = args
	if (!filePath) return yield* Effect.fail(new ArgsError({ message: "Usage: bench-queries.ts inspect <file>" }))

	const fetchOutput = yield* readJsonFile<FetchOutput>(filePath)

	yield* Effect.forEach(fetchOutput.samples, (sample) =>
		Effect.gen(function* () {
			const baseSql = stripFormatClause(sample.sampleSql)
			yield* Console.log(`\n${"━".repeat(80)}`)
			yield* Console.log(`${sample.context}  ${sample.fingerprint}  (profile=${sample.profile || "—"})`)
			yield* Console.log("━".repeat(80))

			for (const variant of ["EXPLAIN", "EXPLAIN PIPELINE"] as const) {
				const res = yield* ch.run(`${variant} ${baseSql} FORMAT TabSeparatedRaw`)
				yield* Console.log(`\n── ${variant} ───────────────────────────────`)
				if (res.status !== 200) {
					yield* Console.log(`  ERROR (${res.status}): ${res.body.slice(0, 500)}`)
				} else {
					const indented = res.body
						.trimEnd()
						.split("\n")
						.map((l) => `  ${l}`)
						.join("\n")
					yield* Console.log(indented || "  (empty)")
				}
			}
		}),
	)
})

// ---------------------------------------------------------------------------
// Subcommand: compare
// ---------------------------------------------------------------------------

const compareCmd = Effect.fn("bench.compare")(function* (args: ReadonlyArray<string>) {
	const [aPath, bPath] = args
	if (!aPath || !bPath) {
		return yield* Effect.fail(new ArgsError({ message: "Usage: bench-queries.ts compare <a.json> <b.json>" }))
	}
	const a = yield* readJsonFile<RunOutput>(aPath)
	const b = yield* readJsonFile<RunOutput>(bPath)
	const bByFp = new Map(b.results.map((r) => [r.fingerprint, r]))

	const rows = a.results.map((aResult) => {
		const bResult = bByFp.get(aResult.fingerprint)
		if (!bResult) {
			return [aResult.context || "—", aResult.fingerprint, formatMs(aResult.aggregates.p95WallMs), "—", "(missing in b)", "—", "—"]
		}
		return [
			aResult.context || "—",
			aResult.fingerprint,
			formatMs(aResult.aggregates.p95WallMs),
			formatMs(bResult.aggregates.p95WallMs),
			formatDelta(aResult.aggregates.p95WallMs, bResult.aggregates.p95WallMs, "ms"),
			formatDelta(aResult.aggregates.meanReadBytes, bResult.aggregates.meanReadBytes, "bytes"),
			formatDelta(aResult.aggregates.meanMemoryUsage, bResult.aggregates.meanMemoryUsage, "bytes"),
		]
	})

	yield* Console.log(
		renderTable(
			`Compare: ${aPath} → ${bPath}`,
			[
				{ header: "context", width: 22 },
				{ header: "fingerprint", width: 14 },
				{ header: "a p95", width: 10, align: "right" },
				{ header: "b p95", width: 10, align: "right" },
				{ header: "Δ p95 wall", width: 20, align: "right" },
				{ header: "Δ read bytes", width: 20, align: "right" },
				{ header: "Δ memory", width: 20, align: "right" },
			],
			rows,
		),
	)
})

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

const HELP = `bench-queries — measure ClickHouse query performance

Usage:
  bench-queries fetch    [--context name] [--profile name] [--since 24h]
                         [--top 20] [--out path] [--org id]
  bench-queries run      <file> [--runs 5] [--warmup 1] [--out path]
  bench-queries inspect  <file>
  bench-queries compare  <a.json> <b.json>

Env (resolved via Config): TINYBIRD_HOST, TINYBIRD_TOKEN (fetch);
  CLICKHOUSE_URL, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD, CLICKHOUSE_DATABASE (run, inspect).
`

const BenchLive = Layer.mergeAll(ClickHouse.layer, Tinybird.layer)

const main = Effect.gen(function* () {
	const [subcommand, ...rest] = process.argv.slice(2)
	switch (subcommand) {
		case undefined:
		case "--help":
		case "-h":
			return yield* Console.log(HELP)
		case "fetch":
			return yield* fetchCmd(rest)
		case "run":
			return yield* runCmd(rest)
		case "inspect":
			return yield* inspectCmd(rest)
		case "compare":
			return yield* compareCmd(rest)
		default:
			return yield* Effect.fail(new ArgsError({ message: `Unknown subcommand "${subcommand}".\n\n${HELP}` }))
	}
}).pipe(Effect.provide(BenchLive))

Effect.runPromiseExit(main).then((exit) => {
	if (Exit.isFailure(exit)) {
		console.error(Cause.pretty(exit.cause))
		process.exit(1)
	}
})
