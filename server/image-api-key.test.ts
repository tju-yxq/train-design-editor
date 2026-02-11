import { describe, expect, it } from "vitest";
import axios from "axios";
import { ENV } from "./_core/env";

describe("Image API Key Validation", () => {
  it("should validate ALIYUN_IMAGE_API_KEY by calling image edit API", async () => {
    // 验证环境变量已设置
    expect(ENV.aliyunImageApiKey).toBeTruthy();
    expect(ENV.aliyunImageApiKey).toMatch(/^sk-/);
    
    console.log('[Test] Using API Key:', ENV.aliyunImageApiKey.substring(0, 10) + '...');
    
    // 创建一个简单的测试图片Base64 (1x1红色像素)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    
    try {
      const response = await axios.post(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
        {
          model: 'qwen-image-edit-max',
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  {
                    image: testImageBase64
                  },
                  {
                    text: '将这个图片改为蓝色'
                  }
                ]
              }
            ]
          },
          parameters: {
            n: 1,
            size: '1024*1024'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${ENV.aliyunImageApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );
      
      // 验证响应格式
      expect(response.data).toHaveProperty('output');
      expect(response.data.output).toHaveProperty('choices');
      expect(response.data.output.choices).toBeInstanceOf(Array);
      expect(response.data.output.choices.length).toBeGreaterThan(0);
      
      const imageUrl = response.data.output.choices[0]?.message?.content?.[0]?.image;
      expect(imageUrl).toBeTruthy();
      expect(imageUrl).toMatch(/^https?:\/\//);
      
      console.log('[Test] ✅ API Key验证成功!');
      console.log('[Test] 生成的图片URL:', imageUrl);
      
    } catch (error: any) {
      if (error.response) {
        console.error('[Test] API调用失败:');
        console.error('状态码:', error.response.status);
        console.error('错误信息:', error.response.data);
        
        // 如果是权限错误,提供清晰的错误信息
        if (error.response.status === 403) {
          throw new Error('API Key没有访问qwen-image-edit-max模型的权限');
        }
      }
      throw error;
    }
  }, 60000); // 60秒超时
});
