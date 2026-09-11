
import { createDeepSeek } from '@ai-sdk/deepseek';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  tool,
  toUIMessageStream,
  UIMessage,

} from 'ai';
import { z } from 'zod';


export async function POST(req: Request) {
  const { messages, deepThink, model, apiKey, baseUrl }: { messages: UIMessage[]; deepThink: boolean; model: string; apiKey: string; baseUrl: string  } = await req.json();
  
// 提交时把 deepThink 作为第二个参数传进去
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  sendMessage(
    { text: input },
    { body: { deepThink } }  // 🚨 每次发送时动态传入
  );
  setInput("");
};
  const modelName = createDeepSeek({
    apiKey: process.env.ALI_API_KEY,//DEEPSEEK_API_KEY,
    // apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.ALI_OpenAI,

    // baseURL: baseUrl,
  });
  const result = streamText({
    // model: modelName(model),
    // model: modelName("deepseek-v4-flash"),
    model: modelName("qwen3.7-flash"),
    providerOptions: {
      modelName: {
        thinking: {
          type: deepThink ? 'enabled' : 'disabled',
        }
      }
    },
    system: `你是智能助手，请遵守以下输出规范：
      1. 当你需要给用户"可直接复制或下载的最终内容"（例如：代码、文章、清单、配置、报告等）时，
        必须通过调用 render_output 工具返回，参数 content 就是那段最终内容。
      2. 解释性文字（说明、注释、前言、总结）不要放进工具参数里，
        直接作为普通文本输出，会自动显示在文本框外面。
      3. 工具调用前后都可以有普通文本，它们都会渲染为普通消息。
      4. 一段回复中可以多次调用 render_output 来输出多段内容。`,
    messages: await convertToModelMessages(messages),
    tools: {
        render_output: tool({
        description:
          "把用户需要复制或下载的最终内容放进这里，会显示成一个带复制/下载按钮的文本框",
        inputSchema: z.object({
          content: z
            .string()
            .describe("用户需要复制或下载的最终内容，例如代码、文章、清单等"),
          language: z
            .string()
            .optional()
            .describe("可选，内容语言或类型，例如 code / markdown / text"),
          filename: z
            .string()
            .optional()
            .describe("可选，建议的下载文件名，例如 output.py"),
        }),
        // 🚨 关键：加 execute 函数，把输入原样返回
        execute: async (input) => {
          return input;
        },
      }),
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}