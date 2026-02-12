import { users, type InsertUser } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { hash, compare } from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * 注册新用户（本地认证）
 */
export async function registerUser(username: string, password: string, name?: string, email?: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 检查用户名是否已存在
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) {
    throw new Error("Username already exists");
  }

  // 哈希密码
  const passwordHash = await hash(password, SALT_ROUNDS);

  // 创建用户
  const newUser: InsertUser = {
    username,
    password: passwordHash,
    name: name || username,
    email,
    loginMethod: "local",
    lastSignedIn: new Date(),
  };

  const result = await db.insert(users).values(newUser);
  const userId = Number(result[0].insertId);

  // 返回用户信息（不包含密码）
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length === 0) {
    throw new Error("Failed to create user");
  }

  const { password: _, ...userWithoutPassword } = user[0];
  return userWithoutPassword;
}

/**
 * 验证用户登录
 */
export async function validateLogin(username: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 查找用户
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (result.length === 0) {
    throw new Error("Invalid username or password");
  }

  const user = result[0];
  if (!user.password) {
    throw new Error("This account uses OAuth login");
  }

  // 验证密码
  const isValid = await compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid username or password");
  }

  // 更新最后登录时间
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
