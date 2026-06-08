import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

/**
 * One in-flight / last schema-apply run per org. The schema-apply Cloudflare
 * Workflow writes progress here as it executes each step (structural DDL +
 * backfill chunks); the dashboard polls it via the apply-schema status endpoint.
 *
 * Single row per org (orgId pk) — a new apply overwrites the previous run's
 * progress. Durable migration bookkeeping still lives in ClickHouse's
 * `_maple_schema_migrations`; this table is only the UI-facing progress mirror.
 */
export const orgClickHouseSchemaApplyRuns = sqliteTable(
	"org_clickhouse_schema_apply_runs",
	{
		orgId: text("org_id").notNull(),
		// Cloudflare Workflow instance id (for status()/dedup), null before kickoff.
		workflowInstanceId: text("workflow_instance_id"),
		// "queued" | "running" | "succeeded" | "failed"
		status: text("status").notNull(),
		// Human-readable current phase, e.g. "migration 4 · backfill service_overview_spans".
		phase: text("phase"),
		// Migration version currently being applied (null when between/!running).
		currentMigration: integer("current_migration", { mode: "number" }),
		stepsTotal: integer("steps_total", { mode: "number" }),
		stepsDone: integer("steps_done", { mode: "number" }),
		// JSON: migration versions applied this run, and skipped-object summary.
		appliedVersions: text("applied_versions"),
		skipped: text("skipped"),
		errorMessage: text("error_message"),
		startedAt: integer("started_at", { mode: "number" }),
		finishedAt: integer("finished_at", { mode: "number" }),
		createdAt: integer("created_at", { mode: "number" }).notNull(),
		updatedAt: integer("updated_at", { mode: "number" }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.orgId] })],
)

export type OrgClickHouseSchemaApplyRunRow = typeof orgClickHouseSchemaApplyRuns.$inferSelect
export type OrgClickHouseSchemaApplyRunInsert = typeof orgClickHouseSchemaApplyRuns.$inferInsert
