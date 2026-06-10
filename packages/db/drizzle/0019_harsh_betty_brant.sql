ALTER TABLE `scrape_targets` ADD `target_type` text DEFAULT 'prometheus' NOT NULL;--> statement-breakpoint
ALTER TABLE `scrape_targets` ADD `discovery_config_json` text;