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
  } = body;
  // const enableRAG = body.llm_enable_rag //?? false;

  console.log("[CHAT] mcpServers 数量:", mcpServers?.length ?? 0);
  // log("[CHAT] mcpServers 数量:", mcpServers?.length ?? 0);

  // ==================== Combine tools ====================
  const mcpTools = buildMcpTools(mcpServers);
  const skillTools = buildSkillTools(skills);

  const allTools = { ...ALL_TOOLS, ...mcpTools, ...skillTools };

  console.log("[TOOLS] Available:", Object.keys(allTools));
  const logs: { level: string; text: string }[] = [];
  const pendingLogs = (level: string, text: string) => {logs.push({level, text})}

 // ==================== RAG 检索 ====================
let ragContext = "";
let ragSources: any[] = [];
 if(llm_enable_rag){
try {
  // 取最后一条用户消息
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const question =
    lastUserMessage?.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("\n") ?? "";

  if (question) {
    // 取当前用户部门（实现部门隔离）
    const department = await getSessionDepartment();

    ragSources = await searchRAG(question, {
      department,
      topK: 5,
      minSimilarity: 0.4,
    });

    if (ragSources.length > 0) {
          pendingLogs("INFO", `[RAG] Indexed ${ragSources.length} pcs of segment`);
        ragSources.forEach((s, i) => {
        pendingLogs("LOG", `[RAG ${i + 1}] 《${s.title}》\n Similarity: ${s.similarity.toFixed(3)}`);
  });
      ragContext = ragSources
        .map((c, i) => `[${i + 1}] From ${c.title}\n${c.content}`)
        .join("\n\n");
    }

    console.log("[RAG] question:", question);
    console.log("[RAG] department:", department);
    console.log("[RAG] sources:", ragSources.length);
  }
} catch (err) {
  console.error("[RAG] search failed:", err);
  // indexed failed, continue to normal flow
  pendingLogs("ERROR", `[RAG ERROR] Search failed: ${err}`);
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
=== 资料结束 ===

注意：当前没有检索到相关企业文档。如果用户询问公司制度、政策、流程相关的问题，请提示用户开启知识库或联系管理员。`
    : basePrompt;
  

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
      logs.forEach((l) => sendLog(`"RAG" [${l.level}]`, l.text));
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