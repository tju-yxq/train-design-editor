import { describe, expect, it } from "vitest";
import { downloadImageAsBase64 } from "./aliyun";

describe("Image Edit Functionality", () => {
  it("should download and convert image to Base64", async () => {
    const imageUrl = "https://gitee.com/Yu-xinqiang0413/images/raw/master/img/image-20260211164812591.png";
    
    // 测试图片下载和Base64转换
    const base64Image = await downloadImageAsBase64(imageUrl);
    
    // 验证Base64格式
    expect(base64Image).toMatch(/^data:image\/[a-z]+;base64,/);
    
    // 验证Base64长度(应该大于1000字符)
    expect(base64Image.length).toBeGreaterThan(1000);
    
    console.log(`[Test] Base64 image size: ${base64Image.length} characters`);
  }, 30000); // 30秒超时

  it("should handle invalid image URL", async () => {
    const invalidUrl = "https://invalid-domain-that-does-not-exist.com/image.png";
    
    await expect(downloadImageAsBase64(invalidUrl)).rejects.toThrow();
  });
});
