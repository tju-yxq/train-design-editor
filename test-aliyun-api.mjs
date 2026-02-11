import axios from 'axios';

const API_KEY = 'sk-94792c8a780140ad80c06b62ee06fc84';
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';
const MODEL = 'qwen-image-edit-max';

console.log('=== 阿里云百炼API测试 ===\n');
console.log('API Key:', API_KEY.substring(0, 10) + '...');
console.log('Base URL:', BASE_URL);
console.log('Model:', MODEL);
console.log('\n');

// 测试图像编辑模型
async function testImageEdit() {
  console.log(`【测试】图像编辑模型 (${MODEL})`);
  
  // 创建一个简单的测试图片Base64 (1x1红色像素)
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  try {
    console.log('发送请求...');
    const response = await axios.post(
      `${BASE_URL}/services/aigc/multimodal-generation/generation`,
      {
        model: MODEL,
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
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );
    
    console.log('✅ 成功! 模型可访问');
    console.log('\n完整响应:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.output?.results?.[0]?.url) {
      console.log('\n生成的图片URL:', response.data.output.results[0].url);
    }
    
    return true;
  } catch (error) {
    console.log('❌ 失败!');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误:', error.message);
    }
    return false;
  }
}

testImageEdit().catch(console.error);
