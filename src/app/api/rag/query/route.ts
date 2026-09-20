import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { embedOne } from "@/lib/embedding";

export async function POST(req: NextRequest) {
  const { question, department } = await req.json();
  
  // 1. 把用户问题向量化
  const queryEmbedding = await embedOne(question);
  
  // 2. pgvector 相似度检索（只查该部门的文档）
  const sql = `
    SELECT dc.content, sd.title, 1 - (dc.embedding <=> $1::vector) AS similarity
    FROM document_chunks dc
    JOIN source_documents sd ON dc.document_id = sd.id
    JOIN document_departments dd ON dd.document_id = sd.id
    JOIN departments d ON d.id = dd.department_id
    WHERE d.code = $2
    ORDER BY dc.embedding <=> $1::vector
    LIMIT 5;
  `;
  const { rows } = await pool.query(sql, [JSON.stringify(queryEmbedding), department]);
  
  return NextResponse.json({ chunks: rows });
}