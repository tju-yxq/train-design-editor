import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getOrCreateDesignParameters, 
  updateDesignParameters, 
  createEditHistory, 
  updateEditHistory, 
  getUserEditHistory,
  getEditHistoryById,
  getLatestSuccessfulImage
} from "./db";
import { parseParametersWithQwen, generateEditPrompt, editImageWithQwen } from "./aliyun";
import { ENV } from "./_core/env";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  design: router({
    // 获取当前用户的设计参数
    getParameters: protectedProcedure.query(async ({ ctx }) => {
      return await getOrCreateDesignParameters(ctx.user.id);
    }),

    // 获取编辑历史
    getHistory: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
      }))
      .query(async ({ ctx, input }) => {
        return await getUserEditHistory(ctx.user.id, input.limit);
      }),

    // 获取单条历史记录
    getHistoryItem: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const item = await getEditHistoryById(input.id);
        if (!item || item.userId !== ctx.user.id) {
          throw new Error('历史记录不存在');
        }
        return item;
      }),

    // 提交编辑请求
    submitEdit: protectedProcedure
      .input(z.object({
        userInput: z.string().min(1, '请输入修改描述'),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // 1. 获取当前参数
          const currentParams = await getOrCreateDesignParameters(ctx.user.id);

          // 2. 解析用户输入
          const parsedChanges = await parseParametersWithQwen(input.userInput);

          // 3. 计算实际参数值(处理相对变化)
          const actualChanges: Record<string, any> = {};
          for (const [key, value] of Object.entries(parsedChanges)) {
            if (typeof value === 'string' && value.includes('+')) {
              // 处理相对增加: "trainHeadLength + 1000"
              const match = value.match(/([a-zA-Z]+)\s*\+\s*(\d+)/);
              if (match && match[1] === key) {
                const increment = parseInt(match[2]!, 10);
                actualChanges[key] = (currentParams[key as keyof typeof currentParams] as number) + increment;
              } else {
                actualChanges[key] = value;
              }
            } else if (typeof value === 'string' && value.includes('-')) {
              // 处理相对减少: "trainHeadLength - 500"
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

          // 4. 合并参数
          const updatedParams = {
            ...currentParams,
            ...actualChanges,
          };

          // 5. 创建历史记录(状态为processing)
          const history = await createEditHistory({
            userId: ctx.user.id,
            userInput: input.userInput,
            parsedChanges: JSON.stringify(actualChanges),
            parametersSnapshot: JSON.stringify(updatedParams),
            status: 'processing',
          });

          // 6. 异步生成图片
          (async () => {
            try {
              // 获取最新成功生成的图片，如果没有则使用基础图片
              const latestImage = await getLatestSuccessfulImage(ctx.user.id);
              const baseImage = latestImage || ENV.baseImageUrl;
              
              const prompt = generateEditPrompt(actualChanges, updatedParams);
              const imageUrl = await editImageWithQwen(prompt, baseImage);

              // 更新历史记录
              await updateEditHistory(history.id, {
                generatedImageUrl: imageUrl,
                status: 'completed',
              });

              // 更新设计参数(使用外层已计算好的actualChanges)
              await updateDesignParameters(currentParams.id, actualChanges);
            } catch (error: any) {
              console.error('[Design] Failed to generate image:', error);
              await updateEditHistory(history.id, {
                status: 'failed',
                errorMessage: error.message,
              });
            }
          })();

          return {
            success: true,
            historyId: history.id,
            parsedChanges,
          };
        } catch (error: any) {
          console.error('[Design] Submit edit failed:', error);
          throw new Error(`提交失败: ${error.message}`);
        }
      }),

    // 获取基础图片URL
    getBaseImage: publicProcedure.query(() => {
      return { url: ENV.baseImageUrl };
    }),
  }),
});

export type AppRouter = typeof appRouter;
