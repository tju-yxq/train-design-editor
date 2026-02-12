import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Optional for local auth. */
  openId: varchar("openId", { length: 64 }).unique(),
  /** Username for local authentication */
  username: varchar("username", { length: 64 }).unique(),
  /** Password hash for local authentication */
  password: varchar("password", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 高铁车头设计参数表
 * 存储当前设计的所有参数值
 */
export const designParameters = mysqlTable("design_parameters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  
  // 1.1 整体几何参数
  headCarTotalLength: int("head_car_total_length").default(28550).notNull(), // 车头总长 mm
  maxWidth: int("max_width").default(3360).notNull(), // 最大横截面宽度 mm
  maxHeight: int("max_height").default(3850).notNull(), // 车辆最大高度 mm
  centerToRailHeight: int("center_to_rail_height").default(1500).notNull(), // 车辆中心距轨面高度 mm
  railGauge: int("rail_gauge").default(1435).notNull(), // 标准轨距 mm
  
  // 1.2 车头几何参数
  trainHeadLength: int("train_head_length").default(10500).notNull(), // 车头长度 mm
  headBogieDistance: int("head_bogie_distance").default(5200).notNull(), // 车头转向架距离 mm
  couplerHeight: int("coupler_height").default(1000).notNull(), // 车钩中心高度 mm
  
  // 1.3 雨刮器系统参数
  wiperLength: int("wiper_length").default(2100).notNull(), // 雨刮器长度 mm
  wiperAngle: int("wiper_angle").default(72).notNull(), // 雨刮器安装角度 度
  wiperPosition: int("wiper_position").default(2200).notNull(), // 车头至雨刮器安装位置 mm
  
  // 1.4 转向架参数
  bogieAxleDistance: int("bogie_axle_distance").default(2500).notNull(), // 转向架轴距 mm
  bogieCenterDistance: int("bogie_center_distance").default(17800).notNull(), // 转向架中心距 mm
  wheelDiameter: int("wheel_diameter").default(920).notNull(), // 轮径 mm
  
  // 1.5 横截面参数
  crossSectionPosition: int("cross_section_position").default(10500).notNull(), // 横截面位置 mm
  topArcRadius: int("top_arc_radius").default(200).notNull(), // 顶部圆弧半径 mm
  
  // 其他常用参数
  trainHeadHeight: int("train_head_height").default(3850).notNull(), // 车头高度 mm
  cabinHeight: int("cabin_height").default(3850).notNull(), // 驾驶室高度 mm
  streamlineCurvature: int("streamline_curvature").default(72).notNull(), // 流线型曲率度
  windowWidth: int("window_width").default(1200).notNull(), // 车窗宽度 mm
  windowHeight: int("window_height").default(800).notNull(), // 车窗高度 mm
  chassisHeight: int("chassis_height").default(1500).notNull(), // 底盘高度 mm
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DesignParameters = typeof designParameters.$inferSelect;
export type InsertDesignParameters = typeof designParameters.$inferInsert;

/**
 * 设计会话表
 * 每个会话代表一个独立的设计流程,从基础图片开始
 */
export const designSessions = mysqlTable("design_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  // 会话名称
  sessionName: varchar("session_name", { length: 255 }).notNull(),
  // 会话描述
  description: text("description"),
  // 是否为当前活跃会话
  isActive: int("is_active").default(0).notNull(), // 0=false, 1=true
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DesignSession = typeof designSessions.$inferSelect;
export type InsertDesignSession = typeof designSessions.$inferInsert;

/**
 * 编辑历史记录表
 * 存储每次修改的详细信息和生成的图片
 */
export const editHistory = mysqlTable("edit_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  // 所属设计会话
  sessionId: int("session_id").notNull().references(() => designSessions.id),
  // 用户输入的自然语言描述
  userInput: text("user_input").notNull(),
  // 解析后的参数变更JSON
  parsedChanges: text("parsed_changes").notNull(), // JSON string
  // 生成的图片URL
  generatedImageUrl: text("generated_image_url"),
  // 生成状态: pending, processing, completed, failed
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  // 错误信息(如果生成失败)
  errorMessage: text("error_message"),
  // 当前参数快照(JSON)
  parametersSnapshot: text("parameters_snapshot").notNull(), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EditHistory = typeof editHistory.$inferSelect;
export type InsertEditHistory = typeof editHistory.$inferInsert;
