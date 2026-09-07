ALTER TABLE `order_items` ADD `cost_price` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `cost_price` real DEFAULT 0 NOT NULL;