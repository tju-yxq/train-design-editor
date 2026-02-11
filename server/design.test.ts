import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getOrCreateDesignParameters, getUserEditHistory } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Design System", () => {
  it("should get or create design parameters for a user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const params = await caller.design.getParameters();

    expect(params).toBeDefined();
    expect(params.userId).toBe(ctx.user!.id);
    expect(params.trainHeadLength).toBe(10500);
    expect(params.trainHeadHeight).toBe(3850);
    expect(params.cabinHeight).toBe(3850);
    expect(params.streamlineCurvature).toBe(72);
    expect(params.windowWidth).toBe(1200);
    expect(params.windowHeight).toBe(800);
    expect(params.chassisHeight).toBe(1500);
    expect(params.totalLength).toBe(28550);
    expect(params.maxWidth).toBe(3360);
    expect(params.maxHeight).toBe(3850);
  });

  it("should get base image URL", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.design.getBaseImage();

    expect(result).toBeDefined();
    expect(result.url).toBe("https://gitee.com/Yu-xinqiang0413/images/raw/master/img/image-20260211164812591.png");
  });

  it("should get edit history for a user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.design.getHistory({ limit: 10 });

    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
  });

  it("should submit edit request and create history record", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.design.submitEdit({
      userInput: "将车头长度改为12米",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.historyId).toBeGreaterThan(0);
    expect(result.parsedChanges).toBeDefined();

    // 验证历史记录是否创建
    const history = await getUserEditHistory(ctx.user!.id, 1);
    expect(history.length).toBeGreaterThan(0);
    
    const latestHistory = history[0];
    expect(latestHistory!.userInput).toBe("将车头长度改为12米");
    expect(latestHistory!.status).toBe("processing");
  }, 30000);
});
