// src/app/api/chat/route.ts
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
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
  stepCountIs,
  streamText,
  toUIMessageStream,
  UIMessage,
} from "ai";
import { searchRAG } from "@/lib/rag";
import { getSessionDepartment } from "@/lib/auth";
import { enqueueChatLog, enqueueChatSession } from "@/lib/chat_logger";
import { createMCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";

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

  const useDeepThink = deepThink === true;

  // Playwright MCP 客户端句柄，用于在请求结束时关闭
  let playwrightMcp: any = null;

  // ==================== 日志收集 ====================
  const logs: { level: string; text: string; color: string }[] = [];
  const pendingLogs = (level: string, text: string, color: string) => {
    logs.push({ level, text, color });
  };

  // ==================== 模型配置兜底 ====================
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

  // ==================== 构建工具集 ====================
  const mcpTools = buildMcpTools(mcpServers);
  const skillTools = buildSkillTools(skills);

  // 👇 如果开启了联网搜索，挂载 Playwright MCP
  let playwrightTools: Record<string, any> = {};
  if (llm_enable_search) {
    try {
      const transport = new Experimental_StdioMCPTransport({
        command: "npx",
        // args: ["@playwright/mcp@latest", "--headless"],
        args: [
          "--yes",
          "@playwright/mcp@latest",
          "--headless",
          "--config",
          "./playwright-mcp-config.json",

          // "--timeout",
          // "60000",
          // "--user-agent",
          // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        ],
      });

      playwrightMcp = await createMCPClient({ transport });
      playwrightTools = await playwrightMcp.tools();

      console.log(
        "[TOOLS] Playwright MCP loaded:",
        Object.keys(playwrightTools),
      );
      logs.push({
        level: "INFO",
        text: `[PLAYWRIGHT] 加载成功: ${Object.keys(playwrightTools).join(", ")}}`,
        color: "green",
      });
    } catch (err) {
      console.error("[TOOLS] Failed to load Playwright MCP:", err);
      pendingLogs("ERROR", `[PLAYWRIGHT] 加载失败: ${err}`, "red");
      logs.push({
        level: "ERROR",
        text: `[PLAYWRIGHT] 加载失败: ${err}`,
        color: "red",
      });
    }
  }

  const rawTools = {
    ...ALL_TOOLS,
    ...mcpTools,
    ...skillTools,
    ...playwrightTools,
  };

  console.log("[TOOLS] Available:", Object.keys(rawTools));

  // ==================== 给每个工具包一层日志 ====================
  const allTools: Record<string, any> = {};
  for (const [name, tool] of Object.entries(rawTools)) {
    const originalExecute = (tool as any).execute;

    if (typeof originalExecute === "function") {
      allTools[name] = {
        ...(tool as object),
        execute: async (args: any, options: any) => {
          const start = Date.now();
          const argsPreview = JSON.stringify(args ?? {}).slice(0, 300);

          console.log(`[TOOL_CALL] ▶ ${name} args=${argsPreview}`);
          pendingLogs("INFO", `[TOOL_CALL] ▶ ${name}`, "purple");

          try {
            const result = await originalExecute(args, options);
            const duration = Date.now() - start;

            console.log(`[TOOL_CALL] ✓ ${name} (${duration}ms)`);
            pendingLogs(
              "INFO",
              `[TOOL_CALL] ✓ ${name} (${duration}ms)`,
              "purple",
            );

            return result;
          } catch (err: any) {
            const duration = Date.now() - start;

            console.error(`[TOOL_CALL] ✗ ${name} (${duration}ms)`, err.message);
            pendingLogs(
              "ERROR",
              `[TOOL_CALL] ✗ ${name} (${duration}ms) ${err.message}`,
              "red",
            );

            throw err;
          }
        },
      };
    } else {
      allTools[name] = tool;
    }
  }

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

  // ==================== 构建 system prompt ====================
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

  // ==================== onFinish ====================
  const onFinishHandler = async ({ text, usage, response }: any) => {
    try {
      const assistantMessages =
        response?.messages?.filter((m: any) => m.role === "assistant") ?? [];

      for (const msg of assistantMessages) {
        const parts = msg.parts ?? [];
        for (const part of parts) {
          if (part.type === "tool-call") {
            console.log(
              `[TOOL_CALL] model requested: ${part.toolName}`,
              JSON.stringify(part.args ?? {}).slice(0, 300),
            );
            pendingLogs(
              "INFO",
              `[TOOL_CALL] requested: ${part.toolName}`,
              "purple",
            );
          }
          if (part.type === "tool-result") {
            console.log(
              `[TOOL_CALL] result returned: ${part.toolName}`,
              JSON.stringify(part.result ?? {}).slice(0, 300),
            );
            pendingLogs(
              "INFO",
              `[TOOL_CALL] result: ${part.toolName}`,
              "purple",
            );
          }
        }
      }
    } catch (err) {
      console.warn("[TOOL_CALL] failed to extract tool calls:", err);
    }

    console.log("\x1b[35m[PROMPT CONTENT]\x1b[0m → system:", systemPrompt);
    console.log(
      "\x1b[35m[PROMPT CONTENT]\x1b[0m → messages:",
      JSON.stringify(messages, null, 2),
    );

    const inputTokens = usage.inputTokens ?? usage.prompt_tokens ?? 0;
    const outputTokens = usage.outputTokens ?? usage.completion_tokens ?? 0;
    const totalTokens = usage.totalTokens ?? usage.total_tokens ?? 0;

    pendingLogs("INFO", `[TOKEN prompt] inputTokens: ${inputTokens}`, "blue");
    pendingLogs(
      "INFO",
      ` \x1b[35m[TOKEN completion]\x1b[0m →outputTokens: ${outputTokens}`,
      "blue",
    );
    pendingLogs("INFO", `[TOKEN total] totalTokens: ${totalTokens}`, "blue");

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
      stopWhen: stepCountIs(10), // 👈 允许最多 10 步工具调用

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
      stopWhen: stepCountIs(10), // 👈 允许最多 10 步

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

      logs.forEach((l) => sendLog(l.level, l.text, l.color));

      sendLog("INFO", `[TOOLS]: ${Object.keys(allTools).join(", ")}`, "purple");
      sendLog("INFO", `[MCP SERVERS]: ${mcpServers?.length ?? 0}`, "purple");
      sendLog("INFO", `[SKILLS]: ${skills.length ?? 0}`, "blue");

      writer.merge(toUIMessageStream({ stream: result.stream }));

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
        console.warn("[stream] failed to get usage:", err);
      }
    },
    onEnd: async () => {
      if (playwrightMcp) {
        console.log("[TOOLS] Closing Playwright MCP...");
        try {
          await playwrightMcp.close();
        } catch (err) {
          console.warn("[TOOLS] Failed to close Playwright MCP:", err);
        }
      }
    },
  });

  // 注意：这里用 after 回调无法直接 await，所以用 Promise 包装
  const response = createUIMessageStreamResponse({ stream });

  // 请求结束后关闭 Playwright MCP
  // if (playwrightMcp) {
  //   try {
  //     await playwrightMcp.close();
  //   } catch (err) {
  //     console.warn("[TOOLS] Failed to close Playwright MCP:", err);
  //   }
  // }

  return response;
}
