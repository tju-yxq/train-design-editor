CREATE TABLE `design_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_name` varchar(255) NOT NULL,
	`description` text,
	`is_active` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `design_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `head_car_total_length` int DEFAULT 28550 NOT NULL;--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `center_to_rail_height` int DEFAULT 1500 NOT NULL;--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `rail_gauge` int DEFAULT 1435 NOT NULL;--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `head_bogie_distance` int DEFAULT 5200 NOT NULL;--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `coupler_height` int DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `wiper_length` int DEFAULT 2100 NOT NULL;--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `wiper_angle` int DEFAULT 72 NOT NULL;--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `wiper_position` int DEFAULT 2200 NOT NULL;--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `bogie_axle_distance` int DEFAULT 2500 NOT NULL;--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `bogie_center_distance` int DEFAULT 17800 NOT NULL;--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `wheel_diameter` int DEFAULT 920 NOT NULL;--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `cross_section_position` int DEFAULT 10500 NOT NULL;--> statement-breakpoint
ALTER TABLE `design_parameters` ADD `top_arc_radius` int DEFAULT 200 NOT NULL;--> statement-breakpoint
ALTER TABLE `edit_history` ADD `session_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `design_sessions` ADD CONSTRAINT `design_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `edit_history` ADD CONSTRAINT `edit_history_session_id_design_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `design_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `design_parameters` DROP COLUMN `total_length`;