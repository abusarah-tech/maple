CREATE TABLE `org_clickhouse_schema_apply_runs` (
	`org_id` text PRIMARY KEY NOT NULL,
	`workflow_instance_id` text,
	`status` text NOT NULL,
	`phase` text,
	`current_migration` integer,
	`steps_total` integer,
	`steps_done` integer,
	`applied_versions` text,
	`skipped` text,
	`error_message` text,
	`started_at` integer,
	`finished_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
