ALTER TABLE `categories` ADD `remote_id` integer;--> statement-breakpoint
ALTER TABLE `categories` ADD `updated_at` text DEFAULT (current_timestamp) NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `synced_at` text;--> statement-breakpoint
ALTER TABLE `expenses` ADD `remote_id` integer;--> statement-breakpoint
ALTER TABLE `expenses` ADD `synced_at` text;--> statement-breakpoint
ALTER TABLE `modifier_groups` ADD `remote_id` integer;--> statement-breakpoint
ALTER TABLE `modifier_groups` ADD `updated_at` text DEFAULT (current_timestamp) NOT NULL;--> statement-breakpoint
ALTER TABLE `modifier_groups` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `modifier_groups` ADD `synced_at` text;--> statement-breakpoint
ALTER TABLE `modifier_options` ADD `remote_id` integer;--> statement-breakpoint
ALTER TABLE `modifier_options` ADD `updated_at` text DEFAULT (current_timestamp) NOT NULL;--> statement-breakpoint
ALTER TABLE `modifier_options` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `modifier_options` ADD `synced_at` text;--> statement-breakpoint
ALTER TABLE `order_items` ADD `remote_id` integer;--> statement-breakpoint
ALTER TABLE `order_items` ADD `synced_at` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `remote_id` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `synced_at` text;--> statement-breakpoint
ALTER TABLE `products` ADD `remote_id` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `updated_at` text DEFAULT (current_timestamp) NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `products` ADD `synced_at` text;