CREATE TABLE `other_incomes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`remote_id` integer,
	`synced_at` text
);
