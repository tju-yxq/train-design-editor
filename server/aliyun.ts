import axios from 'axios';
import { ENV } from './_core/env';

const ALIYUN_API_BASE = 'https://dashscope.aliyuncs.com/api/v1';

interface QwenPlusMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QwenPlusResponse {
  output: {
    choices: Array<{
      message: {
        role: string;
        content: string;
      };
    }>;
  };
  usage: {
    total_tokens: number;
  };
}

interface ImageEditRequest {
  model: string;
  input: {
    prompt: string;
    image_url: string;
  };
  parameters?: {
    size?: string;
    n?: number;
  };
}

interface ImageEditResponse {
  output: {
    results: Array<{
      url: string;
    }>;
  };
  usage: {
    image_count: number;
  };
}

/**
 * 调用Qwen-Plus进行自然语言参数解析
 */
export async function parseParametersWithQwen(userInput: string): Promise<Record<string, any>> {
  const systemPrompt = `你是一个高铁车头设计参数解析助手。用户会用中文描述对车头设计的修改需求,你需要将其转换为结构化的参数变更。

支持的参数包括:
- trainHeadLength: 车头长度(单位:mm)
- trainHeadHeight: 车头高度(单位:mm)
- cabinHeight: 驾驶室高度(单位:mm)
- streamlineCurvature: 流线型曲率(单位:度)
- windowWidth: 车窗宽度(单位:mm)
- windowHeight: 车窗高度(单位:mm)
- chassisHeight: 底盘高度(单位:mm)
- totalLength: 总长度(单位:mm)
- maxWidth: 最大宽度(单位:mm)
- maxHeight: 最大高度(单位:mm)

请将用户输入解析为JSON格式,只包含需要修改的参数。如果用户提到的单位是米,请转换为毫米。

示例:
用户输入: "将车头长度增加到11米"
输出: {"trainHeadLength": 11000}

用户输入: "车窗宽度改为1.5米,高度改为1米"
输出: {"windowWidth": 1500, "windowHeight": 1000}

只返回JSON对象,不要包含任何其他文字说明。`;

  try {
    const response = await axios.post<QwenPlusResponse>(
      `${ALIYUN_API_BASE}/services/aigc/text-generation/generation`,
      {
        model: 'qwen-plus',
        input: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput }
          ]
        },
        parameters: {
          result_format: 'message',
          temperature: 0.1,
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ENV.aliyunApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data.output.choices[0]?.message.content || '{}';
    
    // 尝试提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(content);
  } catch (error: any) {
    console.error('[Aliyun] Failed to parse parameters:', error.response?.data || error.message);
    throw new Error(`参数解析失败: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * 生成图像编辑提示词
 */
export function generateEditPrompt(changes: Record<string, any>, allParams: Record<string, any>): string {
  const paramDescriptions: Record<string, string> = {
    trainHeadLength: '车头长度',
    trainHeadHeight: '车头高度',
    cabinHeight: '驾驶室高度',
    streamlineCurvature: '流线型曲率',
    windowWidth: '车窗宽度',
    windowHeight: '车窗高度',
    chassisHeight: '底盘高度',
    totalLength: '总长度',
    maxWidth: '最大宽度',
    maxHeight: '最大高度',
  };

  const changeDescriptions = Object.entries(changes).map(([key, value]) => {
    const desc = paramDescriptions[key] || key;
    return `${desc}: ${value}mm`;
  }).join(', ');

  return `[基础规范]
工程制图,正交投影,无透视,纯白背景,单色灰度车身
清晰外部轮廓线,无阴影无反光,无运动模糊
无Logo/文字/装饰纹理/环境元素

[修改要求]
修改以下参数: ${changeDescriptions}

[几何参数]
车头总长: ${allParams.totalLength}mm, 最大宽度: ${allParams.maxWidth}mm, 最大高度: ${allParams.maxHeight}mm
车头长度: ${allParams.trainHeadLength}mm, 车头高度: ${allParams.trainHeadHeight}mm
驾驶室高度: ${allParams.cabinHeight}mm, 底盘高度: ${allParams.chassisHeight}mm
车窗宽度: ${allParams.windowWidth}mm, 车窗高度: ${allParams.windowHeight}mm
流线型曲率: ${allParams.streamlineCurvature}度

[视图约束]
- 侧视图:连续5段样条曲线定义轮廓,车窗均匀分布
- 正视图:横截面为顶部圆弧+垂直侧壁的圆角矩形
- 两视图关键尺寸严格一致

[禁止项]
无艺术化夸张,无品牌标识,无透视效果

请根据上述参数修改图纸,保持工程制图规范。`;
}

/**
 * 调用Qwen-Image-Edit-Max进行图像编辑
 */
export async function editImageWithQwen(prompt: string, imageUrl: string): Promise<string> {
  try {
    const response = await axios.post<ImageEditResponse>(
      `${ALIYUN_API_BASE}/services/aigc/image-generation/generation`,
      {
        model: 'qwen-vl-max',
        input: {
          prompt: prompt,
          image_url: imageUrl,
        },
        parameters: {
          size: '1024*1024',
          n: 1,
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ENV.aliyunApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const resultUrl = response.data.output.results[0]?.url;
    if (!resultUrl) {
      throw new Error('未能生成图片');
    }

    return resultUrl;
  } catch (error: any) {
    console.error('[Aliyun] Failed to edit image:', error.response?.data || error.message);
    throw new Error(`图像编辑失败: ${error.response?.data?.message || error.message}`);
  }
}
