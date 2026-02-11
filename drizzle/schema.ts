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
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
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
  // 车头几何参数
  trainHeadLength: int("train_head_length").default(10500).notNull(), // mm
  trainHeadHeight: int("train_head_height").default(3850).notNull(), // mm
  cabinHeight: int("cabin_height").default(3850).notNull(), // mm
  streamlineCurvature: int("streamline_curvature").default(72).notNull(), // 度数
  windowWidth: int("window_width").default(1200).notNull(), // mm
  windowHeight: int("window_height").default(800).notNull(), // mm
  chassisHeight: int("chassis_height").default(1500).notNull(), // mm
  // 其他参数
  totalLength: int("total_length").default(28550).notNull(), // mm
  maxWidth: int("max_width").default(3360).notNull(), // mm
  maxHeight: int("max_height").default(3850).notNull(), // mm
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DesignParameters = typeof designParameters.$inferSelect;
export type InsertDesignParameters = typeof designParameters.$inferInsert;

/**
 * 编辑历史记录表
 * 存储每次修改的详细信息和生成的图片
 */
export const editHistory = mysqlTable("edit_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
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
