-- Custom SQL migration file, put your code below! --

-- 重命名 total_length 为 head_car_total_length
ALTER TABLE `design_parameters` CHANGE COLUMN `total_length` `head_car_total_length` int NOT NULL DEFAULT 28550;

-- 添加新的参数列
ALTER TABLE `design_parameters` ADD COLUMN `center_to_rail_height` int NOT NULL DEFAULT 1500;
ALTER TABLE `design_parameters` ADD COLUMN `rail_gauge` int NOT NULL DEFAULT 1435;
ALTER TABLE `design_parameters` ADD COLUMN `head_bogie_distance` int NOT NULL DEFAULT 5200;
ALTER TABLE `design_parameters` ADD COLUMN `coupler_height` int NOT NULL DEFAULT 1000;
ALTER TABLE `design_parameters` ADD COLUMN `wiper_length` int NOT NULL DEFAULT 2100;
ALTER TABLE `design_parameters` ADD COLUMN `wiper_angle` int NOT NULL DEFAULT 72;
ALTER TABLE `design_parameters` ADD COLUMN `wiper_position` int NOT NULL DEFAULT 2200;
ALTER TABLE `design_parameters` ADD COLUMN `bogie_axle_distance` int NOT NULL DEFAULT 2500;
ALTER TABLE `design_parameters` ADD COLUMN `bogie_center_distance` int NOT NULL DEFAULT 17800;
ALTER TABLE `design_parameters` ADD COLUMN `wheel_diameter` int NOT NULL DEFAULT 920;
ALTER TABLE `design_parameters` ADD COLUMN `cross_section_position` int NOT NULL DEFAULT 10500;
ALTER TABLE `design_parameters` ADD COLUMN `top_arc_radius` int NOT NULL DEFAULT 200;