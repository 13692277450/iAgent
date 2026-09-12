
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
    });
  }

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}