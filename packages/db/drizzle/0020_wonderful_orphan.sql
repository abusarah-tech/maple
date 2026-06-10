CREATE TABLE `scrape_target_checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_id` text NOT NULL,
	`org_id` text NOT NULL,
	`sub_target_key` text DEFAULT '' NOT NULL,
	`checked_at` integer NOT NULL,
	`error` text,
	`duration_ms` integer,
	`samples_scraped` integer,
	`samples_post_relabel` integer,
	FOREIGN KEY (`target_id`) REFERENCES `scrape_targets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `scrape_target_checks_target_checked_idx` ON `scrape_target_checks` (`target_id`,`checked_at`);