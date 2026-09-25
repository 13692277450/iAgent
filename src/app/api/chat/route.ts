// src/app/api/chat/route.ts
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
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
import { searchRAG } from "@/lib/rag";
import { getSessionDepartment } from "@/lib/auth";
import { enqueueChatLog, enqueueChatSession } from "@/lib/chat_logger";

export async function POST(req: Request) {
  const session = await getSession();
  const username = session?.username ?? "anonymous";

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
    llm_enable_rag = false,
    llm_enable_search = false,
    sessionId,
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
    llm_enable_rag?: boolean;
    llm_enable_search?: boolean;
    sessionId?: string;
  } = body;

  // 👇 统一转成 boolean
  const useDeepThink = deepThink === true;

  // 👇 模型配置兜底
  let finalModel = llm_model;
  let finalApiKey = llm_apiKey;
  let finalBaseUrl = llm_baseUrl;

  if (!finalBaseUrl || !finalModel) {
    try {
      const { rows } = await pool.query(
        `SELECT llm_apikey, llm_baseurl, llm_model FROM llm
         WHERE is_default = true LIMIT 1`,
      );
      if (rows.length > 0) {
        finalApiKey = finalApiKey || rows[0].llm_apikey;
        finalBaseUrl = finalBaseUrl || rows[0].llm_baseurl;
        finalModel = finalModel || rows[0].llm_model;
      }
    } catch (err) {
      console.error("[CHAT] failed to fetch default model:", err);
    }
  }

  if (!finalBaseUrl) {
    return new Response(JSON.stringify({ error: "No LLM model configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("[CHAT] mcpServers 数量:", mcpServers?.length ?? 0);

  // ==================== Chat bubble 日志 ====================
  if (sessionId) {
    enqueueChatSession({ sessionId, username, llmModel: finalModel });
  }

  // 👇 提取用户消息，立即入队
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");
  const userContent =
    lastUserMessage?.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("\n") ?? "";

  if (sessionId && userContent) {
    enqueueChatLog({
      sessionId,
      username,
      role: "user",
      content: userContent,
      llmModel: finalModel,
      parts: lastUserMessage?.parts,
    });
  }

  // ==================== Combine tools ====================
  const mcpTools = buildMcpTools(mcpServers);
  const skillTools = buildSkillTools(skills);
  const allTools = { ...ALL_TOOLS, ...mcpTools, ...skillTools };

  console.log("[TOOLS] Available:", Object.keys(allTools));

  const logs: { level: string; text: string; color: string }[] = [];
  const pendingLogs = (level: string, text: string, color: string) => {
    logs.push({ level, text, color });
  };

  // ==================== RAG 检索 ====================
  let ragContext = "";
  let ragSources: any[] = [];

  if (llm_enable_rag) {
    try {
      if (userContent) {
        const department = await getSessionDepartment();

        ragSources = await searchRAG(userContent, {
          department,
          topK: 5,
          minSimilarity: 0.3,
        });

        if (ragSources.length > 0) {
          pendingLogs(
            "INFO",
            `[RAG] Indexed ${ragSources.length} pcs of segment`,
            "blue",
          );
          ragSources.forEach((s, i) => {
            pendingLogs(
              "LOG",
              `[RAG ${i + 1}] 《${s.title}》\n Similarity: ${s.similarity.toFixed(3)}`,
              "purple",
            );
          });
          ragContext = ragSources
            .map((c, i) => `[${i + 1}] From ${c.title}\n${c.content}`)
            .join("\n\n");
        }

        console.log("[RAG] question:", userContent);
        console.log("[RAG] department:", department);
        console.log("[RAG] sources:", ragSources.length);
      }
    } catch (err) {
      console.error("[RAG] search failed:", err);
      pendingLogs("ERROR", `[RAG ERROR] Search failed: ${err}`, "red");
    }
  }

  // ==================== Build system prompt ====================
  const basePrompt =
    selectedSystemPrompt ||
    "You are a smart assistant, you can answer any question.";

  const systemPrompt = ragContext
    ? `${basePrompt}

【重要指令】你必须优先使用下面的参考资料回答问题。
- 如果参考资料中有相关信息，必须基于参考资料回答，并标注引用编号 [1]、[2]
- 如果参考资料中没有相关信息，明确回复"根据现有资料无法回答"
- 不要用你自己的知识替代参考资料

=== 参考资料 ===
${ragContext}
=== 资料结束 ===`
    : basePrompt;

  const isDeepSeek = finalBaseUrl?.includes("deepseek");

  // ==================== onFinish：token + 日志 ====================
  const onFinishHandler = async ({ text, usage, response }: any) => {
    // console.log("[TOKEN] raw usage object:", usage);
    // console.log("[TOKEN] usage type:", typeof usage);
    // console.log(
    //   "[TOKEN] usage keys:",
    //   usage ? Object.keys(usage) : "null/undefined",
    // );

    const inputTokens = usage.inputTokens ?? usage.prompt_tokens ?? 0;
    const outputTokens = usage.outputTokens ?? usage.completion_tokens ?? 0;
    const totalTokens = usage.totalTokens ?? usage.total_tokens ?? 0;

    // console.log("[TOKEN￥￥￥￥￥￥￥] usage:", {
    //   prompt: inputTokens,
    //   completion: outputTokens,
    //   total: totalTokens,
    // });

    pendingLogs("INFO", `[TOKEN prompt] inputTokens: ${inputTokens}`, "blue");
    pendingLogs(
      "INFO",
      `[TOKEN completion] outputTokens: ${outputTokens}`,
      "blue",
    );
    pendingLogs("INFO", `[TOKEN total] totalTokens: ${totalTokens}`, "blue");

    // 👇 AI 回复入队
    if (sessionId) {
      const assistantParts = response?.messages
        ?.filter((m: any) => m.role === "assistant")
        ?.at(-1)?.parts ?? [{ type: "text", text: text ?? "" }];

      console.log("[chat-logger] onFinish enqueue assistant:", {
        sessionId,
        ragUsed: llm_enable_rag && ragSources.length > 0,
        ragSourcesCount: ragSources.length,
      });

      enqueueChatLog({
        sessionId,
        username,
        role: "assistant",
        content: text ?? "",
        parts: assistantParts,
        llmModel: finalModel,
        ragUsed: llm_enable_rag && ragSources.length > 0,
        ragSources:
          ragSources.length > 0
            ? ragSources.map((s) => ({
                title: s.title,
                similarity: s.similarity,
                docType: s.docType,
              }))
            : [],
        metadata: {
          usage: {
            input: usage?.inputTokens ?? null,
            output: usage?.outputTokens ?? null,
            total: usage?.totalTokens ?? null,
          },
          deepThink: useDeepThink,
          searchEnabled: llm_enable_search,
        },
      });
    }

    // 👇 token 记录
    try {
      await pool.query(
        `INSERT INTO public.token
           (username, llm_model, prompt_tokens, completion_tokens, total_tokens)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          username,
          finalModel || "unknown",
          usage?.inputTokens ?? 0,
          usage?.outputTokens ?? 0,
          usage?.totalTokens ?? 0,
        ],
      );
    } catch (err) {
      console.error("Failed to record token usage:", err);
    }
  };

  // ==================== streamText ====================
  let result: any;

  if (isDeepSeek) {
    const provider = createDeepSeek({
      apiKey: finalApiKey || process.env.DEEPSEEK_API_KEY,
      baseURL: finalBaseUrl || process.env.DEEPSEEK_BASEURL,
    });

    result = streamText({
      model: provider(finalModel || "deepseek-v4-flash"),
      providerOptions: {
        deepseek: {
          thinking: { type: useDeepThink ? "enabled" : "disabled" },
          enable_search: llm_enable_search,
        },
      },
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: allTools,
      onFinish: onFinishHandler,
    });
  } else {
    const provider = createOpenAICompatible({
      name: "custom",
      apiKey: finalApiKey || process.env.ALI_API_KEY!,
      baseURL: finalBaseUrl,
    });

    result = streamText({
      model: provider(finalModel || "qwen-plus"),
      providerOptions: {
        custom: {
          enable_thinking: useDeepThink,
          extra_body: {
            enable_search: llm_enable_search,
          },
        },
      },
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: allTools,
      onFinish: onFinishHandler,
    });
  }

  // ==================== UI stream ====================
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const sendLog = (level: string, text: string, color: string) => {
        writer.write({
          type: "data-log",
          data: {
            level,
            text,
            color,
            time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
          },
        });
      };

      // 1. 先发 RAG 日志
      logs.forEach((l) => sendLog(l.level, `[RAG] ${l.text}`, l.color));

      // 2. 发其他日志
      sendLog("INFO", `[TOOLS]: ${Object.keys(allTools).join(", ")}`, "purple");
      sendLog("INFO", `[MCP SERVERS]: ${mcpServers?.length ?? 0}`, "purple");
      sendLog("INFO", `[SKILLS]: ${skills.length ?? 0}`, "blue");
      // sendLog("INFO", `[INPUT TOKENS]: ${inputTokens ?? 0}`, "purple");

      // 3. 合并模型流
      writer.merge(toUIMessageStream({ stream: result.stream }));

      // 4. 等流结束后，拿 usage，再写一条 token 日志
      try {
        const usage = await result.usage;
        if (usage) {
          sendLog(
            "INFO",
            `[TOKEN USAGE] Input: ${usage.inputTokens ?? 0}, Output: ${usage.outputTokens ?? 0}, Total: ${usage.totalTokens ?? 0}`,
            "orange",
          );
        }
      } catch (err) {
        console.warn("[stream] fa`i`led to get usage:", err);
      }
    },
  });
  return createUIMessageStreamResponse({ stream });
}
