import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const scrapeTargets = sqliteTable(
	"scrape_targets",
	{
		id: text("id").notNull().primaryKey(),
		orgId: text("org_id").notNull(),
		name: text("name").notNull(),
		serviceName: text("service_name"),
		url: text("url").notNull(),
		targetType: text("target_type").notNull().default("prometheus"),
		discoveryConfigJson: text("discovery_config_json"),
		scrapeIntervalSeconds: integer("scrape_interval_seconds", { mode: "number" }).notNull().default(15),
		labelsJson: text("labels_json"),
		authType: text("auth_type").notNull().default("none"),
		authCredentialsCiphertext: text("auth_credentials_ciphertext"),
		authCredentialsIv: text("auth_credentials_iv"),
		authCredentialsTag: text("auth_credentials_tag"),
		enabled: integer("enabled", { mode: "number" }).notNull().default(1),
		lastScrapeAt: integer("last_scrape_at", { mode: "number" }),
		lastScrapeError: text("last_scrape_error"),
		createdAt: integer("created_at", { mode: "number" }).notNull(),
		updatedAt: integer("updated_at", { mode: "number" }).notNull(),
	},
	(table) => [
		index("scrape_targets_org_idx").on(table.orgId),
		index("scrape_targets_org_enabled_idx").on(table.orgId, table.enabled),
	],
)

export type ScrapeTargetRow = typeof scrapeTargets.$inferSelect
export type ScrapeTargetInsert = typeof scrapeTargets.$inferInsert

/**
 * One row per scheduled scrape attempt, reported by the scraper via
 * `POST /api/internal/scrape-results`. Durable check history for the
 * connectors UI — pruned to 24h with a per-target row cap.
 */
export const scrapeTargetChecks = sqliteTable(
	"scrape_target_checks",
	{
		id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
		targetId: text("target_id")
			.notNull()
			.references(() => scrapeTargets.id, { onDelete: "cascade" }),
		orgId: text("org_id").notNull(),
		/** Sub-target discriminator (e.g. PlanetScale branch); empty string for plain targets. */
		subTargetKey: text("sub_target_key").notNull().default(""),
		checkedAt: integer("checked_at", { mode: "number" }).notNull(),
		/** Null on success; pretty-printed failure otherwise. */
		error: text("error"),
		durationMs: integer("duration_ms", { mode: "number" }),
		samplesScraped: integer("samples_scraped", { mode: "number" }),
		samplesPostRelabel: integer("samples_post_relabel", { mode: "number" }),
	},
	(table) => [index("scrape_target_checks_target_checked_idx").on(table.targetId, table.checkedAt)],
)

export type ScrapeTargetCheckRow = typeof scrapeTargetChecks.$inferSelect
export type ScrapeTargetCheckInsert = typeof scrapeTargetChecks.$inferInsert
