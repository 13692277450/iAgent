// lib/rag.ts
import { pool } from "./db";

export type RAGSource = {
  id: number;
  title: string;
  docType: string | null;
  departments: string[];
  chunkCount: number;
  securityLevel: string;
  ingestedAt: string;
};

export async function listRAGSources(department?: string): Promise<RAGSource[]> {
  const params: string[] = [];
  let deptFilter = "";

  // 按部门过滤（与 RLS 策略呼应，应用层也做一次）
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