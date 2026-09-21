// lib/rag.ts
import { pool } from "./db";
import { embedOne } from "./embedding";

// ============================================================
// 类型定义
// ============================================================
export type RAGSource = {
  id: number;
  title: string;
  docType: string | null;
  departments: string[];
  chunkCount: number;
  securityLevel: string;
  ingestedAt: string;
};

export type RAGChunk = {
  content: string;
  title: string;
  docType: string | null;
  similarity: number;
};

// ============================================================
// 列表查询（你原有的，保持不动）
// ============================================================
export async function listRAGSources(department?: string): Promise<RAGSource[]> {
  const params: string[] = [];
  let deptFilter = "";

  if (department) {
    params.push(department);
    deptFilter = `
      AND EXISTS (
        SELECT 1 FROM document_departments dd
        JOIN departments d ON d.id = dd.department_id
        WHERE dd.document_id = sd.id AND d.code = $1
      )`;
  }

  const sql = `
    SELECT
      sd.id,
      sd.title,
      sd.doc_type,
      sd.metadata->>'security_level' AS security_level,
      sd.ingested_at,
      COUNT(dc.id) AS chunk_count,
      COALESCE(
        ARRAY_AGG(DISTINCT d.code) FILTER (WHERE d.code IS NOT NULL),
        '{}'
      ) AS departments
    FROM source_documents sd
    LEFT JOIN document_chunks dc ON dc.document_id = sd.id
    LEFT JOIN document_departments dd ON dd.document_id = sd.id
    LEFT JOIN departments d ON d.id = dd.department_id
    WHERE 1=1 ${deptFilter}
    GROUP BY sd.id
    ORDER BY sd.ingested_at DESC
  `;

  const { rows } = await pool.query(sql, params);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    docType: r.doc_type,
    departments: r.departments ?? [],
    chunkCount: Number(r.chunk_count),
    securityLevel: r.security_level ?? "internal",
    ingestedAt: new Date(r.ingested_at).toLocaleString("zh-CN"),
  }));
}

// ============================================================
// 👇 新增：RAG 检索（供 /api/chat 和 /api/rag/query 使用）
// ============================================================
export async function searchRAG(
  question: string,
  options: {
    department?: string;    // 部门代码，如 'HR'
    topK?: number;          // 返回几条，默认 5
    minSimilarity?: number; // 相似度阈值，默认 0.5
  } = {},
): Promise<RAGChunk[]> {
  const { department, topK = 5, minSimilarity = 0.5 } = options;

  // ① 问题向量化
  const queryEmbedding = await embedOne(question);

  // ② pgvector 相似度检索
  const sql = `
    SELECT
      dc.content,
      sd.title,
      sd.doc_type,
      1 - (dc.embedding <=> $1::vector) AS similarity
    FROM document_chunks dc
    JOIN source_documents sd ON dc.document_id = sd.id
    WHERE ($2::text IS NULL OR EXISTS (
      SELECT 1 FROM document_departments dd
      JOIN departments d ON d.id = dd.department_id
      WHERE dd.document_id = sd.id AND d.code = $2
    ))
    ORDER BY dc.embedding <=> $1::vector
    LIMIT $3;
  `;

  const { rows } = await pool.query(sql, [
    JSON.stringify(queryEmbedding),
    department ?? null,
    topK,
  ]);

  // ③ 过滤低相似度结果
  return rows
    .filter((r) => r.similarity >= minSimilarity)
    .map((r) => ({
      content: r.content,
      title: r.title,
      docType: r.doc_type,
      similarity: r.similarity,
    }));
}


// // lib/rag.ts
// import { pool } from "./db";

// export type RAGSource = {
//   id: number;
//   title: string;
//   docType: string | null;
//   departments: string[];
//   chunkCount: number;
//   securityLevel: string;
//   ingestedAt: string;
// };

// export async function listRAGSources(department?: string): Promise<RAGSource[]> {
//   const params: string[] = [];
//   let deptFilter = "";

//   // 按部门过滤（与 RLS 策略呼应，应用层也做一次）
//   if (department) {
//     params.push(department);
//     deptFilter = `
//       AND EXISTS (
//         SELECT 1 FROM document_departments dd
//         JOIN departments d ON d.id = dd.department_id
//         WHERE dd.document_id = sd.id AND d.code = $1
//       )`;
//   }

//   const sql = `
//     SELECT
//       sd.id,
//       sd.title,
//       sd.doc_type,
//       sd.metadata->>'security_level' AS security_level,
//       sd.ingested_at,
//       COUNT(dc.id) AS chunk_count,
//       COALESCE(
//         ARRAY_AGG(DISTINCT d.code) FILTER (WHERE d.code IS NOT NULL),
//         '{}'
//       ) AS departments
//     FROM source_documents sd
//     LEFT JOIN document_chunks dc ON dc.document_id = sd.id
//     LEFT JOIN document_departments dd ON dd.document_id = sd.id
//     LEFT JOIN departments d ON d.id = dd.department_id
//     WHERE 1=1 ${deptFilter}
//     GROUP BY sd.id
//     ORDER BY sd.ingested_at DESC
//   `;

//   const { rows } = await pool.query(sql, params);
//   return rows.map((r) => ({
//     id: r.id,
//     title: r.title,
//     docType: r.doc_type,
//     departments: r.departments ?? [],
//     chunkCount: Number(r.chunk_count),
//     securityLevel: r.security_level ?? "internal",
//     ingestedAt: new Date(r.ingested_at).toLocaleString("zh-CN"),
//   }));
// }