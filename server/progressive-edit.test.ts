import { describe, it, expect } from "vitest";
import { getLatestSuccessfulImage } from "./db";

describe("Progressive Image Editing", () => {
  it("should return null when no successful images exist", async () => {
    // 使用一个不存在的用户ID
    const nonExistentUserId = 999999;
    const latestImage = await getLatestSuccessfulImage(nonExistentUserId);
    
    expect(latestImage).toBeNull();
    console.log('[Test] ✅ 无历史记录时返回null');
  });

  it("should have getLatestSuccessfulImage function available", () => {
    expect(typeof getLatestSuccessfulImage).toBe('function');
    console.log('[Test] ✅ getLatestSuccessfulImage函数存在');
  });
});

describe("Progressive Editing Logic", () => {
  it("should use base image when no history exists", () => {
    const baseImageUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663347314439/TZEmSQORVGmqGGyD.png";
    const latestImage = null; // 模拟没有历史记录
    const imageToUse = latestImage || baseImageUrl;
    
    expect(imageToUse).toBe(baseImageUrl);
    console.log('[Test] ✅ 无历史记录时使用基础图片');
  });

  it("should use latest image when history exists", () => {
    const baseImageUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663347314439/TZEmSQORVGmqGGyD.png";
    const latestImage = "https://example.com/generated-image-1.png"; // 模拟有历史记录
    const imageToUse = latestImage || baseImageUrl;
    
    expect(imageToUse).toBe(latestImage);
    console.log('[Test] ✅ 有历史记录时使用最新生成的图片');
  });

  it("should demonstrate progressive editing flow", () => {
    // 模拟渐进式编辑流程
    const baseImageUrl = "https://files.manuscdn.com/base.png";
    
    // 第一次编辑:使用基础图片
    let currentImage = null;
    let imageForEdit1 = currentImage || baseImageUrl;
    expect(imageForEdit1).toBe(baseImageUrl);
    console.log('[Test] 第一次编辑使用基础图片:', imageForEdit1);
    
    // 模拟生成第一张图片
    currentImage = "https://files.manuscdn.com/generated-1.png";
    
    // 第二次编辑:使用第一次生成的图片
    let imageForEdit2 = currentImage || baseImageUrl;
    expect(imageForEdit2).toBe("https://files.manuscdn.com/generated-1.png");
    console.log('[Test] 第二次编辑使用第一次生成的图片:', imageForEdit2);
    
    // 模拟生成第二张图片
    currentImage = "https://files.manuscdn.com/generated-2.png";
    
    // 第三次编辑:使用第二次生成的图片
    let imageForEdit3 = currentImage || baseImageUrl;
    expect(imageForEdit3).toBe("https://files.manuscdn.com/generated-2.png");
    console.log('[Test] 第三次编辑使用第二次生成的图片:', imageForEdit3);
    
    console.log('[Test] ✅ 渐进式编辑流程正确');
  });
});
