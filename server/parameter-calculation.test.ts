import { describe, it, expect } from "vitest";

describe("Parameter Calculation Logic", () => {
  it("should handle relative increment correctly", () => {
    const currentParams = {
      trainHeadLength: 10000,
      trainHeadHeight: 3850,
    };

    const parsedChanges = {
      trainHeadLength: "trainHeadLength + 1000",
    };

    // 模拟routers.ts中的计算逻辑
    const actualChanges: Record<string, any> = {};
    for (const [key, value] of Object.entries(parsedChanges)) {
      if (typeof value === 'string' && value.includes('+')) {
        const match = value.match(/([a-zA-Z]+)\s*\+\s*(\d+)/);
        if (match && match[1] === key) {
          const increment = parseInt(match[2]!, 10);
          actualChanges[key] = (currentParams[key as keyof typeof currentParams] as number) + increment;
        } else {
          actualChanges[key] = value;
        }
      } else {
        actualChanges[key] = value;
      }
    }

    expect(actualChanges.trainHeadLength).toBe(11000);
    console.log('[Test] ✅ 相对增加计算正确: 10000 + 1000 = 11000');
  });

  it("should handle relative decrement correctly", () => {
    const currentParams = {
      trainHeadLength: 10000,
      trainHeadHeight: 3850,
    };

    const parsedChanges = {
      trainHeadLength: "trainHeadLength - 500",
    };

    const actualChanges: Record<string, any> = {};
    for (const [key, value] of Object.entries(parsedChanges)) {
      if (typeof value === 'string' && value.includes('-')) {
        const match = value.match(/([a-zA-Z]+)\s*-\s*(\d+)/);
        if (match && match[1] === key) {
          const decrement = parseInt(match[2]!, 10);
          actualChanges[key] = (currentParams[key as keyof typeof currentParams] as number) - decrement;
        } else {
          actualChanges[key] = value;
        }
      } else {
        actualChanges[key] = value;
      }
    }

    expect(actualChanges.trainHeadLength).toBe(9500);
    console.log('[Test] ✅ 相对减少计算正确: 10000 - 500 = 9500');
  });

  it("should handle absolute value correctly", () => {
    const currentParams = {
      trainHeadLength: 10000,
      trainHeadHeight: 3850,
    };

    const parsedChanges = {
      trainHeadLength: 12000,
      trainHeadHeight: 4000,
    };

    const actualChanges: Record<string, any> = {};
    for (const [key, value] of Object.entries(parsedChanges)) {
      if (typeof value === 'string' && value.includes('+')) {
        const match = value.match(/([a-zA-Z]+)\s*\+\s*(\d+)/);
        if (match && match[1] === key) {
          const increment = parseInt(match[2]!, 10);
          actualChanges[key] = (currentParams[key as keyof typeof currentParams] as number) + increment;
        } else {
          actualChanges[key] = value;
        }
      } else if (typeof value === 'string' && value.includes('-')) {
        const match = value.match(/([a-zA-Z]+)\s*-\s*(\d+)/);
        if (match && match[1] === key) {
          const decrement = parseInt(match[2]!, 10);
          actualChanges[key] = (currentParams[key as keyof typeof currentParams] as number) - decrement;
        } else {
          actualChanges[key] = value;
        }
      } else {
        actualChanges[key] = value;
      }
    }

    expect(actualChanges.trainHeadLength).toBe(12000);
    expect(actualChanges.trainHeadHeight).toBe(4000);
    console.log('[Test] ✅ 绝对值设置正确: 12000, 4000');
  });
});
