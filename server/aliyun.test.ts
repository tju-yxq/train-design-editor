import { describe, expect, it } from "vitest";
import { parseParametersWithQwen } from "./aliyun";

describe("Aliyun API Integration", () => {
  it("should validate API key by parsing a simple parameter change", async () => {
    // 测试API密钥是否有效,通过解析一个简单的参数变更请求
    const testInput = "将车头长度改为11米";
    
    try {
      const result = await parseParametersWithQwen(testInput);
      
      // 验证返回结果包含预期的参数
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
      
      // 如果解析成功,应该包含trainHeadLength参数
      if (result.trainHeadLength) {
        expect(result.trainHeadLength).toBe(11000);
      }
      
      console.log("[Test] API key validation successful, parsed result:", result);
    } catch (error: any) {
      // 如果API密钥无效,会抛出错误
      console.error("[Test] API key validation failed:", error.message);
      throw new Error(`API密钥验证失败: ${error.message}`);
    }
  }, 30000); // 设置30秒超时
});
