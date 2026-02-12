import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, designParameters, editHistory, designSessions, DesignParameters, InsertDesignParameters, EditHistory, InsertEditHistory, DesignSession, InsertDesignSession } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserById(userId: number): Promise<User | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  try {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.warn("[Database] Error getting user by ID:", error);
    return null;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Design Parameters helpers
export async function getOrCreateDesignParameters(userId: number): Promise<DesignParameters> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const existing = await db.select().from(designParameters).where(eq(designParameters.userId, userId)).limit(1);
  
  if (existing.length > 0) {
    return existing[0]!;
  }

  // Create default parameters
  const [newParams] = await db.insert(designParameters).values({
    userId,
  });

  const created = await db.select().from(designParameters).where(eq(designParameters.id, newParams.insertId)).limit(1);
  return created[0]!;
}

export async function updateDesignParameters(id: number, updates: Partial<InsertDesignParameters>): Promise<DesignParameters> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(designParameters).set(updates).where(eq(designParameters.id, id));
  
  const updated = await db.select().from(designParameters).where(eq(designParameters.id, id)).limit(1);
  return updated[0]!;
}

// Edit History helpers
export async function createEditHistory(data: InsertEditHistory): Promise<EditHistory> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [result] = await db.insert(editHistory).values(data);
  const created = await db.select().from(editHistory).where(eq(editHistory.id, result.insertId)).limit(1);
  return created[0]!;
}

export async function updateEditHistory(id: number, updates: Partial<InsertEditHistory>): Promise<EditHistory> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(editHistory).set(updates).where(eq(editHistory.id, id));
  
  const updated = await db.select().from(editHistory).where(eq(editHistory.id, id)).limit(1);
  return updated[0]!;
}

export async function getUserEditHistory(userId: number, limit: number = 50): Promise<EditHistory[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.select().from(editHistory)
    .where(eq(editHistory.userId, userId))
    .orderBy(desc(editHistory.createdAt))
    .limit(limit);
}

export async function getEditHistoryById(id: number): Promise<EditHistory | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(editHistory).where(eq(editHistory.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLatestSuccessfulImage(userId: number, sessionId?: number): Promise<string | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { and } = await import('drizzle-orm');
  const conditions = [
    eq(editHistory.userId, userId),
    eq(editHistory.status, 'completed')
  ];
  
  if (sessionId !== undefined) {
    conditions.push(eq(editHistory.sessionId, sessionId));
  }
  
  const result = await db.select().from(editHistory)
    .where(and(...conditions))
    .orderBy(desc(editHistory.createdAt))
    .limit(1);
  
  return result.length > 0 && result[0]?.generatedImageUrl ? result[0].generatedImageUrl : null;
}

// Design Session helpers
export async function createDesignSession(data: InsertDesignSession): Promise<DesignSession> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 如果这是活跃会话,先取消其他活跃会话
  if (data.isActive === 1) {
    await db.update(designSessions)
      .set({ isActive: 0 })
      .where(eq(designSessions.userId, data.userId));
  }

  const [result] = await db.insert(designSessions).values(data);
  const created = await db.select().from(designSessions).where(eq(designSessions.id, result.insertId)).limit(1);
  return created[0]!;
}

export async function getUserSessions(userId: number): Promise<DesignSession[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.select().from(designSessions)
    .where(eq(designSessions.userId, userId))
    .orderBy(desc(designSessions.updatedAt));
}

export async function getActiveSession(userId: number): Promise<DesignSession | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { and } = await import('drizzle-orm');
  const result = await db.select().from(designSessions)
    .where(and(
      eq(designSessions.userId, userId),
      eq(designSessions.isActive, 1)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0]! : null;
}

export async function setActiveSession(userId: number, sessionId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 取消所有活跃会话
  await db.update(designSessions)
    .set({ isActive: 0 })
    .where(eq(designSessions.userId, userId));
  
  // 设置新的活跃会话
  await db.update(designSessions)
    .set({ isActive: 1 })
    .where(eq(designSessions.id, sessionId));
}

export async function getSessionHistory(sessionId: number, limit: number = 50): Promise<EditHistory[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.select().from(editHistory)
    .where(eq(editHistory.sessionId, sessionId))
    .orderBy(desc(editHistory.createdAt))
    .limit(limit);
}
