
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { ALL_TOOLS } from "@/lib/tools";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  tool,
  toUIMessageStream,
  UIMessage,
} from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await getSession();   // 🚨 从 cookie 拿
  const username = session ?? "anonymous";

  const {
    messages,
    deepThink,
    llm_model,
    llm_apiKey,
    llm_baseUrl,
    selectedSystemPrompt,
  }: {
    messages: UIMessage[];
    deepThink: boolean;
    llm_model: string;
    llm_apiKey?: string;
    llm_baseUrl?: string;
    selectedSystemPrompt?: string;
  } = await req.json();

  // 🚨 根据 baseUrl 判断用哪个 provider
  const systemPrompt = selectedSystemPrompt || "You are a smart assistant, you can answer any question.";
  const isDeepSeek = llm_baseUrl?.includes("deepseek");
  let result: any;
  if (isDeepSeek) {
    const provider = createDeepSeek({
      apiKey: llm_apiKey || process.env.DEEPSEEK_API_KEY,
      baseURL: llm_baseUrl || process.env.DEEPSEEK_BASEURL,
    });

    result = streamText({
      model: provider(llm_model || "deepseek-v4-flash"),
      providerOptions: {
        deepseek: {
          thinking: { type: deepThink ? "enabled" : "disabled" },
        },
      },
      system: systemPrompt,  //  system prompt
      messages: await convertToModelMessages(messages),
      tools: ALL_TOOLS,

      onFinish: async ({ usage, text }) => {
        console.log("========== usage 原始对象 ==========");
        console.log(JSON.stringify(usage, null, 2));
      try {
        await pool.query(
          `INSERT INTO public.token 
             (username, llm_model, prompt_tokens, completion_tokens, total_tokens)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            username || "anonymous",
            llm_model || "unknown",
            usage.inputTokens ?? 0,
            usage.outputTokens ?? 0,
            usage.totalTokens ?? 0,
          ]
        );
        console.log("&&&&&&&&&&token usage:", usage.inputTokenDetails)
      } catch (err) {
        console.error("Failed to record token usage:", err);
      }
    },
    });
  } else {
    // 通义千问、Kimi 等 OpenAI 兼容接口
    const provider = createOpenAICompatible({
      name: "custom",
      apiKey: llm_apiKey || process.env.ALI_API_KEY!,
      baseURL: llm_baseUrl || process.env.ALI_OpenAI!,
    });

    result = streamText({
      model: provider(llm_model || "qwen3.7-flash"),
      providerOptions: {
        custom: {
          // 通义千问的思考模式参数
          enable_thinking: deepThink,
        },
      },
      system: systemPrompt,  //  system prompt  
      messages: await convertToModelMessages(messages),
      tools: ALL_TOOLS,
      onFinish: async ({ usage, text }) => {
      try {
        await pool.query(
          `INSERT INTO public.token 
             (username, llm_model, prompt_tokens, completion_tokens, total_tokens)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            username || "anonymous",
            llm_model || "unknown",
            usage.inputTokens ?? 0,
            usage.outputTokens ?? 0,
            usage.totalTokens ?? 0,
          ]
        );
        console.log("&&&&&&&&&&token usage:", usage.inputTokenDetails)
      } catch (err) {
        console.error("Failed to record token usage:", err);
      }
    },
    });
  }

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}