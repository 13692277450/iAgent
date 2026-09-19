// lib/embedding.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.ALI_OPEN_AI_API_KEY,
  baseURL: process.env.ALI_OPENAI_API_BASE_URL,
});

// 维度必须和数据库里 vector(N) 保持一致
// text-embedding-3-small → 1536
// text-embedding-3-large → 3072
const MODEL = "qwen3.7-text-embedding";

/**
 * 批量把文本转成向量。
 * 输入顺序与输出顺序一一对应。
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  // OpenAI 单次请求最多 2048 条，按 100 一批更稳妥
  const BATCH = 100;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await openai.embeddings.create({
      model: MODEL,
      input: batch,
    });
    // res.data 顺序与输入一致
    results.push(...res.data.map((d) => d.embedding));
  }

  return results;
}

/** 单条文本嵌入（查询时用） */
export async function embedOne(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}