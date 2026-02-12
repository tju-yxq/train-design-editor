-- 手动创建表结构 (兼容腾讯云 TDSQL)

USE train_design;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(64) NOT NULL,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 设计参数表
CREATE TABLE IF NOT EXISTS `design_parameters` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `head_car_total_length` int NOT NULL DEFAULT 28550,
  `max_width` int NOT NULL DEFAULT 3360,
  `max_height` int NOT NULL DEFAULT 3850,
  `center_to_rail_height` int NOT NULL DEFAULT 1500,
  `rail_gauge` int NOT NULL DEFAULT 1435,
  `train_head_length` int NOT NULL DEFAULT 10500,
  `head_bogie_distance` int NOT NULL DEFAULT 5200,
  `coupler_height` int NOT NULL DEFAULT 1000,
  `wiper_length` int NOT NULL DEFAULT 2100,
  `wiper_angle` int NOT NULL DEFAULT 72,
  `wiper_position` int NOT NULL DEFAULT 2200,
  `bogie_axle_distance` int NOT NULL DEFAULT 2500,
  `bogie_center_distance` int NOT NULL DEFAULT 17800,
  `wheel_diameter` int NOT NULL DEFAULT 920,
  `cross_section_position` int NOT NULL DEFAULT 10500,
  `top_arc_radius` int NOT NULL DEFAULT 200,
  `train_head_height` int NOT NULL DEFAULT 3850,
  `cabin_height` int NOT NULL DEFAULT 3850,
  `streamline_curvature` int NOT NULL DEFAULT 72,
  `window_width` int NOT NULL DEFAULT 1200,
  `window_height` int NOT NULL DEFAULT 800,
  `chassis_height` int NOT NULL DEFAULT 1500,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `design_parameters_id` PRIMARY KEY(`id`),
  CONSTRAINT `design_parameters_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 设计会话表
CREATE TABLE IF NOT EXISTS `design_sessions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `session_name` varchar(255) NOT NULL,
  `description` text,
  `is_active` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `design_sessions_id` PRIMARY KEY(`id`),
  CONSTRAINT `design_sessions_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 编辑历史表
CREATE TABLE IF NOT EXISTS `edit_history` (
  `id` int AUTO_INCREMENT NOT NULL,
  `session_id` int NOT NULL,
  `user_id` int NOT NULL,
  `operation_type` varchar(50) NOT NULL,
  `edit_prompt` text,
  `parameters_snapshot` text,
  `generated_image_url` varchar(2048),
  `base_image_url` varchar(2048),
  `mask_image_url` varchar(2048),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `edit_history_id` PRIMARY KEY(`id`),
  CONSTRAINT `edit_history_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `design_sessions`(`id`),
  CONSTRAINT `edit_history_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建迁移记录表
CREATE TABLE IF NOT EXISTS `__drizzle_migrations` (
  `id` SERIAL PRIMARY KEY,
  `hash` text NOT NULL,
  `created_at` bigint
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入迁移记录
INSERT IGNORE INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES
('manual_migration_001', UNIX_TIMESTAMP() * 1000);
