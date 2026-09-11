import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { pool } from "./db";

export type LlmRecord = {
  id: number;
  llm_name: string;
  llm_apikey: string;
  llm_baseurl: string;
  llm_model: string;
};

// 1. 查询所有模型（用于前端下拉菜单）
export async function listLlms() {
  const result = await pool.query<LlmRecord>(
    `SELECT id, llm_name, llm_apikey, llm_baseurl, llm_model 
     FROM public.llm 
     ORDER BY llm_name ASC`
  );
  return result.rows;
}

// 2. 根据 ID 查询单个模型（用于 chat 路由）
export async function getLlmById(id: number): Promise<LlmRecord | null> {
  const result = await pool.query<LlmRecord>(
    `SELECT id, llm_name, llm_apikey, llm_baseurl, llm_model 
     FROM public.llm 
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

// 3. 根据 baseUrl 判断用哪个 provider
export function createModelProvider(record: LlmRecord) {
  const { llm_apikey, llm_baseurl, llm_model } = record;

  // 如果 baseUrl 指向 DeepSeek 官方，用 createDeepSeek
  if (llm_baseurl.includes("deepseek.com")) {
    const deepseek = createDeepSeek({
      apiKey: llm_apikey,
      baseURL: llm_baseurl,
    });
    return { provider: deepseek, model: llm_model, providerKey: "deepseek" };
  }

  // 其他情况（阿里云百炼、自建 OpenAI 兼容接口等）用 createOpenAICompatible
  const compatible = createOpenAICompatible({
    name: "custom",
    apiKey: llm_apikey,
    baseURL: llm_baseurl,
  });
  return { provider: compatible, model: llm_model, providerKey: "custom" };
}