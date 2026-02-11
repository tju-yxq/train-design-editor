import axios from 'axios';
import { ENV } from './_core/env';

const ALIYUN_API_BASE = 'https://dashscope.aliyuncs.com/api/v1';
const IMAGE_EDIT_MODEL = 'qwen-image-edit-max';

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

interface ImageEditResponse {
  output: {
    choices: Array<{
      finish_reason: string;
      message: {
        role: string;
        content: Array<{
          image: string;
        }>;
      };
    }>;
  };
  usage: {
    height: number;
    width: number;
    image_count: number;
  };
  request_id: string;
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
- wiperLength: 雨刮器长度(单位:mm)
- wiperAngle: 雨刮器安装角度(单位:度)
- wiperPosition: 车头至雨刮器安装位置(单位:mm)
- bogieAxleDistance: 转向架轴距(单位:mm)
- bogieCenterDistance: 转向架中心距(单位:mm)
- wheelDiameter: 轮径(单位:mm)
- couplerHeight: 车钩中心高度(单位:mm)
- headCarTotalLength: 头车总长(单位:mm)
- railGauge: 标准轨距(单位:mm)

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
          'Authorization': `Bearer ${ENV.aliyunImageApiKey}`,
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
    wiperLength: '雨刮器长度',
    wiperAngle: '雨刮器安装角度',
    wiperPosition: '车头至雨刮器安装位置',
    bogieAxleDistance: '转向架轴距',
    bogieCenterDistance: '转向架中心距',
    wheelDiameter: '轮径',
    couplerHeight: '车钩中心高度',
    headCarTotalLength: '头车总长',
    railGauge: '标准轨距',
  };

  const changeDescriptions = Object.entries(changes).map(([key, value]) => {
    const desc = paramDescriptions[key] || key;
    const unit = key.includes('Angle') || key.includes('Curvature') ? '度' : 'mm';
    return `${desc}: ${value}${unit}`;
  }).join(', ');

  return `请对这张高铁工程图纸进行局部精确修改。

【修改要求】
只修改以下参数: ${changeDescriptions}

【完整参数规格】
- 车头总长: ${allParams.headCarTotalLength || allParams.totalLength}mm
- 车头长度: ${allParams.trainHeadLength}mm
- 车头高度: ${allParams.trainHeadHeight}mm
- 驾驶室高度: ${allParams.cabinHeight}mm
- 最大宽度: ${allParams.maxWidth}mm
- 最大高度: ${allParams.maxHeight}mm
- 底盘高度: ${allParams.chassisHeight}mm
- 车窗宽度: ${allParams.windowWidth}mm
- 车窗高度: ${allParams.windowHeight}mm
- 流线型曲率: ${allParams.streamlineCurvature}度
- 雨刮器长度: ${allParams.wiperLength}mm
- 雨刮器安装角度: ${allParams.wiperAngle}度
- 转向架轴距: ${allParams.bogieAxleDistance}mm
- 转向架中心距: ${allParams.bogieCenterDistance}mm
- 轮径: ${allParams.wheelDiameter}mm
- 车钩中心高度: ${allParams.couplerHeight}mm
- 标准轨距: ${allParams.railGauge}mm

【严格遵守的规则 - 非常重要！】
1. **两个视图必须保留**: 原图包含两个视图 - 左侧的正视图(从正面看的车头)和右侧的侧视图(从侧面看的完整列车),这两个视图都必须完整保留,不能消失或省略
2. **完整性**: 侧视图必须包含完整的车头+车厢+车尾,不能只显示车头部分
3. **局部修改**: 只对上述“修改要求”中提到的具体参数进行精确调整,其他所有部分完全不变
4. **禁止缩放**: 不允许对整体图像进行放大或缩小,不允许改变图像布局
5. **保持位置**: 正视图在左侧,侧视图在右侧,位置关系不能改变
6. **工程风格**: 保持工程制图风格 - 正交投影、无透视、纯白背景、灰度车身、清晰轮廓线
7. **精确尺寸**: 严格按照给定的参数数值进行修改,确保尺寸准确

再次强调:必须同时保留左侧的正视图和右侧的完整侧视图,只对指定参数进行局部精确修改。`;
}

/**
 * 调用Qwen-Image-Edit-Max进行图像编辑
 */
/**
 * 下载图片并转换为Base64
 */
export async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const buffer = Buffer.from(response.data);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers['content-type'] || 'image/png';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error: any) {
    console.error('[Aliyun] Failed to download image:', error.message);
    throw new Error(`图片下载失败: ${error.message}`);
  }
}

export async function editImageWithQwen(prompt: string, imageUrl: string): Promise<string> {
  try {
    // 将图片URL转换为Base64
    console.log('[Aliyun] Downloading image from:', imageUrl);
    const base64Image = await downloadImageAsBase64(imageUrl);
    console.log('[Aliyun] Image converted to Base64, size:', base64Image.length);

    const response = await axios.post<ImageEditResponse>(
      `${ALIYUN_API_BASE}/services/aigc/multimodal-generation/generation`,
      {
        model: IMAGE_EDIT_MODEL,
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  image: base64Image
                },
                {
                  text: prompt
                }
              ]
            }
          ]
        },
        parameters: {
          n: 1,
          size: '1536*1024'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ENV.aliyunImageApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 180000, // 3分钟超时,图像编辑需要较长时间
      }
    );

    // 根据阿里云文档,响应格式为 output.choices[0].message.content[0].image
    const resultUrl = response.data.output?.choices?.[0]?.message?.content?.[0]?.image;
    if (!resultUrl) {
      console.error('[Aliyun] Unexpected response format:', JSON.stringify(response.data, null, 2));
      throw new Error('未能生成图片');
    }

    console.log('[Aliyun] Image generated successfully:', resultUrl);
    return resultUrl;
  } catch (error: any) {
    console.error('[Aliyun] Failed to edit image:', error.response?.data || error.message);
    throw new Error(`图像编辑失败: ${error.response?.data?.message || error.message}`);
  }
}
