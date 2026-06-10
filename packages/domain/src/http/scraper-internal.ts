import { Schema } from "effect"
import { ScrapeIntervalSeconds, ScrapeTargetId } from "../primitives"

/**
 * Internal contract between the apps/api scrape-target store and the
 * standalone Prometheus scraper (apps/scraper). Both endpoints are
 * authenticated with the `SD_INTERNAL_TOKEN` bearer.
 */

export class InternalScrapeTarget extends Schema.Class<InternalScrapeTarget>("InternalScrapeTarget")({
	id: ScrapeTargetId,
	orgId: Schema.String,
	name: Schema.String,
	serviceName: Schema.NullOr(Schema.String),
	url: Schema.String,
	/**
	 * Discriminates discovered sub-targets that share one logical target row
	 * (e.g. PlanetScale database branches resolved via http_sd). `null` for
	 * plain Prometheus targets. The scraper schedules one fiber per
	 * `(id, subTargetKey)` pair and echoes the key back in result reports and
	 * the scrape-proxy `sub` query param.
	 */
	subTargetKey: Schema.NullOr(Schema.String),
	scrapeIntervalSeconds: ScrapeIntervalSeconds,
	/** Parsed `labelsJson` — extra metric attributes configured on the target. */
	labels: Schema.Record(Schema.String, Schema.String),
	/**
	 * The org's public ingest key (`maple_pk_*`). The scraper sends converted
	 * metrics through the ingest gateway with this key so the data is billed
	 * and routed (Tinybird vs self-managed ClickHouse) exactly like customer
	 * OTLP traffic.
	 */
	ingestKey: Schema.String,
}) {}

export const InternalScrapeTargetList = Schema.Array(InternalScrapeTarget)

export class ScrapeResultReport extends Schema.Class<ScrapeResultReport>("ScrapeResultReport")({
	targetId: ScrapeTargetId,
	/** Epoch milliseconds at which the scrape was attempted. */
	scrapedAt: Schema.Number,
	/** Null on success; pretty-printed failure otherwise. */
	error: Schema.NullOr(Schema.String),
	/** Sub-target discriminator echoed from `InternalScrapeTarget.subTargetKey`. */
	subTargetKey: Schema.optionalKey(Schema.NullOr(Schema.String)),
	/** Wall-clock duration of the scrape attempt (fetch + parse + ingest). */
	durationMs: Schema.optionalKey(Schema.Number),
	/** Prometheus samples parsed from the exposition (success only). */
	samplesScraped: Schema.optionalKey(Schema.Number),
	/** OTLP data points actually exported after conversion/drops (success only). */
	samplesPostMetricRelabeling: Schema.optionalKey(Schema.Number),
}) {}

export const ScrapeResultReportList = Schema.Array(ScrapeResultReport)
