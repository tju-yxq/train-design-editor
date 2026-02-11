CREATE TABLE `design_parameters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`train_head_length` int NOT NULL DEFAULT 10500,
	`train_head_height` int NOT NULL DEFAULT 3850,
	`cabin_height` int NOT NULL DEFAULT 3850,
	`streamline_curvature` int NOT NULL DEFAULT 72,
	`window_width` int NOT NULL DEFAULT 1200,
	`window_height` int NOT NULL DEFAULT 800,
	`chassis_height` int NOT NULL DEFAULT 1500,
	`total_length` int NOT NULL DEFAULT 28550,
	`max_width` int NOT NULL DEFAULT 3360,
	`max_height` int NOT NULL DEFAULT 3850,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `design_parameters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `edit_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`user_input` text NOT NULL,
	`parsed_changes` text NOT NULL,
	`generated_image_url` text,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`error_message` text,
	`parameters_snapshot` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `edit_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `design_parameters` ADD CONSTRAINT `design_parameters_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `edit_history` ADD CONSTRAINT `edit_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;