// src/app/api/chat/route.ts
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { log } from "@/lib/logger";
import { buildMcpTools } from "@/lib/mcp_tools";
import { buildSkillTools } from "@/lib/skill_tools";
import { ALL_TOOLS } from "@/lib/tools";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  UIMessage,
} from "ai";

export async function POST(req: Request) {
  const session = await getSession();
  const username = session ?? "anonymous";

  const body = await req.json();

  const {
    messages,
    deepThink,
    llm_model,
    llm_apiKey,
    llm_baseUrl,
    selectedSystemPrompt,
    mcpServers = [],
    skills = [],
    inputTokens = 0,
  }: {
    messages: UIMessage[];
    deepThink: boolean;
    llm_model: string;
    llm_apiKey?: string;
    llm_baseUrl?: string;
    selectedSystemPrompt?: string;
    mcpServers?: any[];
    skills?: any[];
    inputTokens?: number;
  } = body;

  console.log("[CHAT] mcpServers 数量:", mcpServers?.length ?? 0);
  // log("[CHAT] mcpServers 数量:", mcpServers?.length ?? 0);

  // ==================== Combine tools ====================
  const mcpTools = buildMcpTools(mcpServers);
  const skillTools = buildSkillTools(skills);

  const allTools = { ...ALL_TOOLS, ...mcpTools, ...skillTools };

  console.log("[TOOLS] Available:", Object.keys(allTools));


  const systemPrompt =
    selectedSystemPrompt ||
    "You are a smart assistant, you can answer any question.";
  const isDeepSeek = llm_baseUrl?.includes("deepseek");

  // ==================== onFinish：token usage ====================
  const onFinishHandler = async ({ usage }: any) => {
    console.log("[TOKEN] usage:", {
      prompt: usage?.inputTokens,
      completion: usage?.outputTokens,
      total: usage?.totalTokens,
    });
    log("[TOKEN] usage:", {
      prompt: usage?.inputTokens,
      completion: usage?.outputTokens,
      total: usage?.totalTokens,
    });
    try {
      await pool.query(
        `INSERT INTO public.token
           (username, llm_model, prompt_tokens, completion_tokens, total_tokens)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          username,
          llm_model || "unknown",
          usage?.inputTokens ?? 0,
          usage?.outputTokens ?? 0,
          usage?.totalTokens ?? 0,
        ],
      );
    } catch (err) {
      console.error("Failed to record token usage:", err);
    }
  };

  // ====================  streamText  ====================
  let result: any;

  if (isDeepSeek) {
    const provider = createDeepSeek({
      apiKey: llm_apiKey || process.env.DEEPSEEK_API_KEY,
      baseURL: llm_baseUrl || process.env.DEEPSEEK_BASEURL,
    });

    result = streamText({
      model: provider(llm_model || "deepseek-v4-flash"),
      providerOptions: {
        deepseek: { thinking: { type: deepThink ? "enabled" : "disabled" } },
      },
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: allTools,
      onFinish: onFinishHandler,
    });
  } else {
    const provider = createOpenAICompatible({
      name: "custom",
      apiKey: llm_apiKey || process.env.ALI_API_KEY!,
      baseURL: llm_baseUrl || process.env.ALI_OpenAI!,
    });

    result = streamText({
      model: provider(llm_model || "qwen3.7-flash"),
      providerOptions: {
        custom: { enable_thinking: deepThink },
      },
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: allTools,
      onFinish: onFinishHandler,
    });
  }

  // ====================  UI message stream，combine result and log ====================
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const sendLog = (level: string, text: string) => {
        writer.write({
          type: "data-log",
          data: {
            level,
            text,
            time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
          },
        });
      };

      // sendLog("INFO", `[Requesting]: model=${llm_model}, tools=${Object.keys(allTools).length}`);
      sendLog("LOG", `[TOOLS]: ${Object.keys(allTools).join(", ")}`);
      sendLog("INFO", `[MCP SERVERS] : ${mcpServers?.length ?? 0}, names: ${mcpServers?.map((s) => s.name).join(", ") ?? ""}`);
      sendLog("INFO", `[SKILLS] : ${skills.length??0}, names: ${skills?.map((s) => s.name).join(", ") ?? ""}`);
      sendLog("INFO", `[INPUT TOKENS] : ${inputTokens ?? 0}`);
      console.log("[CHAT] skills 数量:", skills?.length ?? 0);            // 🚨 加这行
      console.log("[CHAT] skills 详情:", JSON.stringify(skills, null, 2)); // 🚨 加这行
      // sendLog("LOG", `[SKILLS] count=${skills?.length ?? 0}, names=${skills?.map((s) => s.name).join(", ") ?? ""}`);

      // 🚨 把 result 的流合并进 UI stream
      writer.merge(toUIMessageStream({ stream: result.stream }));
    },
  });

  // ==================== Return ====================
  return createUIMessageStreamResponse({ stream });
}