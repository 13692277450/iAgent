
// src/app/api/chat/route.ts
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { log } from "@/lib/logger";
import { buildMcpTools } from "@/lib/mcp_tools";
import { ALL_TOOLS } from "@/lib/tools";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  convertToModelMessages,
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
  }: {
    messages: UIMessage[];
    deepThink: boolean;
    llm_model: string;
    llm_apiKey?: string;
    llm_baseUrl?: string;
    selectedSystemPrompt?: string;
    mcpServers?: any[];
  } = body;

  // ==================== 调试 ====================
  console.log("[CHAT] body.mcpServers:", mcpServers);
  console.log("[CHAT] mcpServers 数量:", mcpServers?.length ?? 0);
  console.log("[CHAT] 完整 body:", JSON.stringify(body, null, 2));

  // ==================== 合并 tools ====================
  const mcpTools = buildMcpTools(mcpServers as any);
  const allTools = { ...ALL_TOOLS, ...mcpTools };

  // console.log("[TOOLS] 本次可用:", Object.keys(allTools));
  // console.log("[TOOLS] MCP 产出:", Object.keys(mcpTools));
  log(`All Tools: ${allTools}`);

    
  const systemPrompt =
    selectedSystemPrompt || "You are a smart assistant, you can answer any question.";
  const isDeepSeek = llm_baseUrl?.includes("deepseek");

  const onFinishHandler = async ({ usage }: any) => {
    console.log("[TOKEN] usage:", {
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
          username || "anonymous",
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
      tools: allTools,   // 🚨 用 allTools
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
      tools: allTools,   // 🚨 用 allTools
      onFinish: onFinishHandler,
    });
  }

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}




// import { getSession } from "@/lib/auth";
// import { pool } from "@/lib/db";
// import { buildMcpTools } from "@/lib/mcp_tools";
// import { ALL_TOOLS } from "@/lib/tools";
// import { createDeepSeek } from "@ai-sdk/deepseek";
// import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
// import {
//   convertToModelMessages,
//   createUIMessageStreamResponse,
//   streamText,
//   tool,
//   toUIMessageStream,
//   UIMessage,
// } from "ai";
// import { log } from "next/dist/server/typescript/utils";
// import { z } from "zod";

// export async function POST(req: Request) {
//   const session = await getSession();   // 🚨 从 cookie 拿
//   const username = session ?? "anonymous";

//   const {
//     messages,
//     deepThink,
//     llm_model,
//     llm_apiKey,
//     llm_baseUrl,
//     selectedSystemPrompt,
//     mcpServers
//   }: {
//     messages: UIMessage[];
//     deepThink: boolean;
//     llm_model: string;
//     llm_apiKey?: string;
//     llm_baseUrl?: string;
//     selectedSystemPrompt?: string;
//     mcpServers: [];

    
//   } = await req.json();

//   // 🚨 根据 baseUrl 判断用哪个 provider
//   const systemPrompt = selectedSystemPrompt || "You are a smart assistant, you can answer any question.";
//   const isDeepSeek = llm_baseUrl?.includes("deepseek");
//   const mcpTools = buildMcpTools(mcpServers as any);
//   const allTools = { ...ALL_TOOLS, ...mcpTools };

//   console.log("[TOOLS] 本次可用:", Object.keys(allTools));
//   // log(`[TOOLS] 本次可用: ${Object.keys(allTools)}`);
//   // 🚨 调试：看前端到底传了什么
//   console.log("[CHAT] body.mcpServers:", mcpServers);
//   console.log("[CHAT] mcpServers 数量:", mcpServers?.length ?? 0);
//   console.log("[CHAT] 完整 body:", JSON.stringify(req, null, 2));
//   // 期望输出: [TOOLS] 本次可用: ['render_output', 'weather'
//   let result: any;
//   if (isDeepSeek) {
//     const provider = createDeepSeek({
//       apiKey: llm_apiKey || process.env.DEEPSEEK_API_KEY,
//       baseURL: llm_baseUrl || process.env.DEEPSEEK_BASEURL,
//     });

//     result = streamText({
//       model: provider(llm_model || "deepseek-v4-flash"),
//       providerOptions: {
//         deepseek: {
//           thinking: { type: deepThink ? "enabled" : "disabled" },
//         },
//       },
//       system: systemPrompt,  //  system prompt
//       messages: await convertToModelMessages(messages),
//       tools: allTools,
//       onFinish: async ({ usage, text }) => {
//         console.log("========== usage object ==========");
//         console.log(JSON.stringify(usage, null, 2));
//         log(`All Tools: ${allTools}`);
//       try {
//         await pool.query(
//           `INSERT INTO public.token 
//              (username, llm_model, prompt_tokens, completion_tokens, total_tokens)
//            VALUES ($1, $2, $3, $4, $5)`,
//           [
//             username || "anonymous",
//             llm_model || "unknown",
//             usage.inputTokens ?? 0,
//             usage.outputTokens ?? 0,
//             usage.totalTokens ?? 0,
//           ]
//         );
//         log("Token prompt usage:" + usage.inputTokens)
//         log("Token completion usage:" + usage.outputTokens)
//       } catch (err) {
//         log("Failed to record token usage:" + err);
//       }
//     },
//     });
//   } else {
//     // Deepseek or Kimi interface
//     const provider = createOpenAICompatible({
//       name: "custom",
//       apiKey: llm_apiKey || process.env.ALI_API_KEY!,
//       baseURL: llm_baseUrl || process.env.ALI_OpenAI!,
//     });

//     result = streamText({
//       model: provider(llm_model || "qwen3.7-flash"),
//       providerOptions: {
//         custom: {
//           // Deeping thinking mode
//           enable_thinking: deepThink,
//         },
//       },
//       system: systemPrompt,  //  system prompt  
//       messages: await convertToModelMessages(messages),
//       tools: allTools,
//       onFinish: async ({ usage, text }) => {
//       log(`All Tools: ${allTools}`);
//       console.log(`All Tools: ${allTools}`)

//       try {
//         await pool.query(
//           `INSERT INTO public.token 
//              (username, llm_model, prompt_tokens, completion_tokens, total_tokens)
//            VALUES ($1, $2, $3, $4, $5)`,
//           [
//             username || "anonymous",
//             llm_model || "unknown",
//             usage.inputTokens ?? 0,
//             usage.outputTokens ?? 0,
//             usage.totalTokens ?? 0,
//           ]
//         );
//         log("Token prompt usage:" + usage.inputTokens)
//         log("Token completion usage:" + usage.outputTokens)
//       } catch (err) {
//         log("Failed to record token usage:" + err);
//       }
//     },
//     });
//   }

//   return createUIMessageStreamResponse({
//     stream: toUIMessageStream({ stream: result.stream }),
//   });
// }