import { createClient as createClickHouseClient } from "@clickhouse/client-web"
import { Tinybird } from "@tinybirdco/sdk"
import { Clock, Context, Effect, Layer, Option, Redacted } from "effect"
import type { WarehouseQueryRequest } from "@maple/domain/http"
import {
	makeWarehouseExecutor,
	toWarehouseQueryError,
	type ResolvedWarehouseConfig,
	type SqlQueryOptions,
	type WarehouseExecutorDeps,
	type WarehouseQueryServiceShape,
	type WarehouseSqlClient,
	type WarehouseSqlError,
} from "@maple/query-engine/execution"
import type { CompiledQuery } from "@maple/query-engine/ch"
import { WarehouseExecutor } from "@maple/query-engine/observability"
import { Env } from "./Env"
import type { TenantContext } from "../services/AuthService"
import { OrgClickHouseSettingsService } from "../services/OrgClickHouseSettingsService"

// ---------------------------------------------------------------------------
// WarehouseQueryService — the API's managed-warehouse executor.
//
// The execution logic (SQL run, retry, error mapping, client cache, OrgId
// scoping, span instrumentation) lives in `@maple/query-engine/execution`. This
// file is the host-app wiring: it constructs the actual ClickHouse / Tinybird
// drivers (the ONLY place `@clickhouse/client-web` + `@tinybirdco/sdk` are
// used) and resolves the per-org upstream config from the DB + env, injecting
// both into `makeWarehouseExecutor`.
// ---------------------------------------------------------------------------

// Re-export the executor types so existing import sites stay stable.
export type { WarehouseQueryServiceShape, SqlQueryOptions, WarehouseSqlError }

type ClickHouseConfig = Extract<ResolvedWarehouseConfig, { _tag: "clickhouse" }>
type TinybirdConfig = Extract<ResolvedWarehouseConfig, { _tag: "tinybird" }>

const createClickHouseSqlClient = (config: ClickHouseConfig): WarehouseSqlClient => {
	const client = createClickHouseClient({
		url: config.url,
		username: config.username,
		password: config.password,
		database: config.database,
	})
	return {
		sql: async (sql: string) => {
			const resultSet = await client.query({
				query: sql,
				format: "JSONEachRow",
			})
			const data = await resultSet.json<Record<string, unknown>>()
			return { data }
		},
		insert: async (datasource, rows) => {
			if (rows.length === 0) return
			// ClickHouse inserts must frame the statement in the request BODY, not the
			// `?query=` URL param. The official `client.insert()` puts `INSERT INTO …
			// FORMAT JSONEachRow` in the query param (see @clickhouse/client-web
			// web_connection: insert() adds `query` to searchParams; query()/command()
			// send it as the body). Managed/proxied ClickHouse endpoints drop that param,
			// so the NDJSON body gets parsed as SQL — "Syntax error at position 1 ({)" —
			// 500-ing every write (this broke demo-seed onboarding). The read path works
			// because `query()` already sends SQL in the body, so we mirror it: send
			// `INSERT … FORMAT JSONEachRow\n<ndjson>` as the body via command().
			const ndjson = rows.map((row) => JSON.stringify(row)).join("\n")
			await client.command({ query: `INSERT INTO ${datasource} FORMAT JSONEachRow\n${ndjson}` })
		},
	}
}

const createTinybirdSdkSqlClient = (config: TinybirdConfig): WarehouseSqlClient => {
	const client = new Tinybird({
		baseUrl: config.host,
		token: config.token,
		datasources: {},
		pipes: {},
		devMode: false,
	})
	return {
		sql: async (sql: string) => client.sql(sql),
		insert: async (datasource, rows) => {
			if (rows.length === 0) return
			const ndjson = rows.map((row) => JSON.stringify(row)).join("\n")
			const url = `${config.host.replace(/\/$/, "")}/v0/events?name=${encodeURIComponent(datasource)}&wait=false`
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-ndjson",
					Authorization: `Bearer ${config.token}`,
				},
				body: ndjson,
			})
			if (!response.ok) {
				const body = await response.text().catch(() => "")
				throw new Error(`HTTP ${response.status} ${response.statusText}: ${body.slice(0, 500)}`)
			}
		},
	}
}

const createClient = (config: ResolvedWarehouseConfig): WarehouseSqlClient =>
	config._tag === "clickhouse" ? createClickHouseSqlClient(config) : createTinybirdSdkSqlClient(config)

let sqlClientFactory: typeof createClient = createClient

export class WarehouseQueryService extends Context.Service<
	WarehouseQueryService,
	WarehouseQueryServiceShape
>()("@maple/api/lib/WarehouseQueryService", {
	make: Effect.gen(function* () {
		const env = yield* Env
		const orgClickHouseSettings = yield* OrgClickHouseSettingsService

		/**
		 * Resolve the upstream config for this tenant's queries.
		 *
		 * Resolution order:
		 *   1. Per-org BYO ClickHouse row (`org_clickhouse_settings`)
		 *   2. Env-level managed ClickHouse (`CLICKHOUSE_URL` set)
		 *   3. Env-level managed Tinybird (`TINYBIRD_HOST` + `TINYBIRD_TOKEN`)
		 */
		// The managed (env-level) upstream: ClickHouse when CLICKHOUSE_URL is set,
		// otherwise the managed Tinybird pipeline. This is the canonical WRITE
		// target — demo-seed, service-map rollups and alert-check inserts all land
		// here — and the read-path fallback when an org has no BYO override.
		const resolveManagedConfig = Effect.fn("WarehouseQueryService.resolveManagedConfig")(
			function* () {
				if (Option.isSome(env.CLICKHOUSE_URL)) {
					yield* Effect.annotateCurrentSpan("db.client", "clickhouse")
					return {
						config: {
							_tag: "clickhouse" as const,
							url: env.CLICKHOUSE_URL.value,
							username: env.CLICKHOUSE_USER,
							password: Option.match(env.CLICKHOUSE_PASSWORD, {
								onNone: () => Redacted.value(env.TINYBIRD_TOKEN),
								onSome: Redacted.value,
							}),
							database: env.CLICKHOUSE_DATABASE,
						},
						source: "managed" as const,
					}
				}

				yield* Effect.annotateCurrentSpan("db.client", "tinybird-sdk")
				return {
					config: {
						_tag: "tinybird" as const,
						host: env.TINYBIRD_HOST,
						token: Redacted.value(env.TINYBIRD_TOKEN),
					},
					source: "managed" as const,
				}
			},
		)

		/**
		 * Read-path config. A per-org BYO ClickHouse row (`org_clickhouse_settings`)
		 * overrides the managed upstream for that org's queries; otherwise we fall
		 * back to the managed config.
		 */
		const resolveConfig: WarehouseExecutorDeps["resolveConfig"] = Effect.fn(
			"WarehouseQueryService.resolveSqlConfig",
		)(function* (tenant, label) {
			const override = yield* orgClickHouseSettings
				.resolveRuntimeConfig(tenant.orgId)
				.pipe(Effect.mapError((error) => toWarehouseQueryError(label, error)))

			if (Option.isSome(override)) {
				yield* Effect.annotateCurrentSpan("clientSource", "org_override")
				yield* Effect.annotateCurrentSpan("db.client", "clickhouse")
				return {
					config: {
						_tag: "clickhouse" as const,
						url: override.value.url,
						username: override.value.user,
						password: override.value.password,
						database: override.value.database,
					},
					source: "org_override" as const,
				}
			}

			yield* Effect.annotateCurrentSpan("clientSource", "managed")
			return yield* resolveManagedConfig()
		})

		/**
		 * Write-path config. Inserts (demo seed, service-map rollups, alert checks)
		 * MUST target the managed Tinybird pipeline — never a per-org BYO ClickHouse
		 * override. The override is a READ concern: an org queries their own
		 * warehouse, but Maple-managed ingest only writes to the managed backend.
		 * Routing writes through the override 500'd every insert (ClickHouse parsed
		 * the JSON body as SQL) and broke demo-seed onboarding for any org with a
		 * BYO ClickHouse row.
		 */
		const resolveIngestConfig: WarehouseExecutorDeps["resolveConfig"] = Effect.fn(
			"WarehouseQueryService.resolveIngestConfig",
		)(function* (tenant, _label) {
			yield* Effect.annotateCurrentSpan("orgId", tenant.orgId)
			yield* Effect.annotateCurrentSpan("clientSource", "managed")
			yield* Effect.annotateCurrentSpan("ingest.routing", "managed")
			return yield* resolveManagedConfig()
		})

		return makeWarehouseExecutor({
			createClient: (config) => sqlClientFactory(config),
			resolveConfig,
			resolveIngestConfig,
		})
	}),
}) {
	static readonly layer = Layer.effect(this, this.make)

	static readonly query = (
		tenant: TenantContext,
		payload: WarehouseQueryRequest,
		options?: SqlQueryOptions,
	) => this.use((service) => service.query(tenant, payload, options))

	static readonly compiledQuery = <T>(
		tenant: TenantContext,
		compiled: CompiledQuery<T>,
		options?: SqlQueryOptions,
	) => this.use((service) => service.compiledQuery(tenant, compiled, options))

	static readonly compiledQueryFirst = <T>(
		tenant: TenantContext,
		compiled: CompiledQuery<T>,
		options?: SqlQueryOptions,
	) => this.use((service) => service.compiledQueryFirst(tenant, compiled, options))

	static readonly ingest = <T>(tenant: TenantContext, datasource: string, rows: ReadonlyArray<T>) =>
		this.use((service) => service.ingest(tenant, datasource, rows))
}

/**
 * Layer that provides the package-level `WarehouseExecutor` for a tenant,
 * backed by `WarehouseQueryService`. The executor name is a public contract
 * from `@maple/query-engine`; only the wiring lives here.
 */
export const makeWarehouseExecutorFromTenant = (tenant: TenantContext) =>
	Layer.effect(
		WarehouseExecutor,
		Effect.map(WarehouseQueryService, (warehouse) => warehouse.asExecutor(tenant)),
	)

export const __testables = {
	setClientFactory: (factory: typeof createClient) => {
		sqlClientFactory = factory
	},
	reset: () => {
		sqlClientFactory = createClient
	},
	createClickHouseSqlClient,
	createTinybirdSdkSqlClient,
}
