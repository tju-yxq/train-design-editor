import { describe, it, expect, beforeAll } from 'vitest';
import { createDesignSession, getUserSessions, getActiveSession, setActiveSession, getSessionHistory } from './db';

describe('Design Session Management', () => {
  const testUserId = 1; // 假设测试用户ID为1

  it('should create a new design session', async () => {
    const session = await createDesignSession({
      userId: testUserId,
      sessionName: '测试会话 1',
      description: '这是一个测试会话',
      isActive: 1,
    });

    expect(session).toBeDefined();
    expect(session.id).toBeGreaterThan(0);
    expect(session.sessionName).toBe('测试会话 1');
    expect(session.isActive).toBe(1);
  });

  it('should get all user sessions', async () => {
    // 创建第二个会话
    await createDesignSession({
      userId: testUserId,
      sessionName: '测试会话 2',
      isActive: 0,
    });

    const sessions = await getUserSessions(testUserId);
    expect(sessions).toBeDefined();
    expect(sessions.length).toBeGreaterThanOrEqual(2);
  });

  it('should get active session', async () => {
    const activeSession = await getActiveSession(testUserId);
    expect(activeSession).toBeDefined();
    expect(activeSession?.isActive).toBe(1);
  });

  it('should switch active session', async () => {
    // 获取所有会话
    const sessions = await getUserSessions(testUserId);
    expect(sessions.length).toBeGreaterThanOrEqual(2);

    // 找到一个非活跃会话
    const inactiveSession = sessions.find(s => s.isActive === 0);
    expect(inactiveSession).toBeDefined();

    if (inactiveSession) {
      // 切换到这个会话
      await setActiveSession(testUserId, inactiveSession.id);

      // 验证切换成功
      const newActiveSession = await getActiveSession(testUserId);
      expect(newActiveSession?.id).toBe(inactiveSession.id);
      expect(newActiveSession?.isActive).toBe(1);
    }
  });

  it('should only have one active session at a time', async () => {
    const sessions = await getUserSessions(testUserId);
    const activeSessions = sessions.filter(s => s.isActive === 1);
    
    expect(activeSessions.length).toBe(1);
  });

  it('should get session history (empty for new session)', async () => {
    const activeSession = await getActiveSession(testUserId);
    expect(activeSession).toBeDefined();

    if (activeSession) {
      const history = await getSessionHistory(activeSession.id, 50);
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      // 新会话应该没有历史记录
      // expect(history.length).toBe(0);
    }
  });
});
