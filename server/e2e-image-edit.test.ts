import { describe, expect, it } from "vitest";
import { parseParametersFromText } from "./aliyun";
import { downloadImageAsBase64, editImageWithQwen } from "./aliyun";
import { ENV } from "./_core/env";

describe("End-to-End Image Edit Flow", () => {
  // 参数解析使用parseParametersWithQwen函数,需要调用API,已在其他测试中验证

  it("should download base image and convert to Base64", async () => {
    const baseImageUrl = ENV.baseImageUrl || "https://gitee.com/Yu-xinqiang0413/images/raw/master/img/image-20260211164812591.png";
    
    const base64Image = await downloadImageAsBase64(baseImageUrl);
    
    expect(base64Image).toMatch(/^data:image\/[a-z]+;base64,/);
    expect(base64Image.length).toBeGreaterThan(100000);
    
    console.log('[Test] ✅ 基础图片下载成功,大小:', base64Image.length);
  }, 30000);

  it("should edit image using Qwen API with correct API key", async () => {
    // 验证使用了正确的API Key
    expect(ENV.aliyunImageApiKey).toBeTruthy();
    expect(ENV.aliyunImageApiKey).toBe('sk-94792c8a780140ad80c06b62ee06fc84');
    
    const baseImageUrl = ENV.baseImageUrl || "https://gitee.com/Yu-xinqiang0413/images/raw/master/img/image-20260211164812591.png";
    const prompt = "将车头部分改为红色";
    
    console.log('[Test] 开始图像编辑测试...');
    console.log('[Test] 使用API Key:', ENV.aliyunImageApiKey.substring(0, 10) + '...');
    
    const resultUrl = await editImageWithQwen(prompt, baseImageUrl);
    
    expect(resultUrl).toBeTruthy();
    expect(resultUrl).toMatch(/^https?:\/\//);
    expect(resultUrl).toContain('dashscope-result');
    
    console.log('[Test] ✅ 图像编辑成功!');
    console.log('[Test] 生成的图片URL:', resultUrl);
  }, 90000); // 90秒超时,因为图像生成需要时间
});
