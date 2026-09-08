PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "name", "sort_order", "is_active") SELECT "id", "name", "sort_order", "is_active" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_modifier_groups` (
	`id` integer PRIMARY KEY NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`selection_type` text NOT NULL,
	`is_required` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_modifier_groups`("id", "product_id", "name", "selection_type", "is_required", "sort_order") SELECT "id", "product_id", "name", "selection_type", "is_required", "sort_order" FROM `modifier_groups`;--> statement-breakpoint
DROP TABLE `modifier_groups`;--> statement-breakpoint
ALTER TABLE `__new_modifier_groups` RENAME TO `modifier_groups`;--> statement-breakpoint
CREATE TABLE `__new_modifier_options` (
	`id` integer PRIMARY KEY NOT NULL,
	`modifier_group_id` integer NOT NULL,
	`name` text NOT NULL,
	`price_delta` real DEFAULT 0 NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`modifier_group_id`) REFERENCES `modifier_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_modifier_options`("id", "modifier_group_id", "name", "price_delta", "is_default", "sort_order") SELECT "id", "modifier_group_id", "name", "price_delta", "is_default", "sort_order" FROM `modifier_options`;--> statement-breakpoint
DROP TABLE `modifier_options`;--> statement-breakpoint
ALTER TABLE `__new_modifier_options` RENAME TO `modifier_options`;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`base_price` real NOT NULL,
	`cost_price` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "category_id", "name", "base_price", "cost_price", "is_active", "sort_order") SELECT "id", "category_id", "name", "base_price", "cost_price", "is_active", "sort_order" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
DELETE FROM `modifier_options`;--> statement-breakpoint
DELETE FROM `modifier_groups`;--> statement-breakpoint
DELETE FROM `products`;--> statement-breakpoint
DELETE FROM `categories`;