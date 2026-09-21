import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { embedOne } from "@/lib/embedding";
import { log } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const { question, department, topK = 5 } = await req.json();

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  try {
    // 1. 把用户问题向量化
    const queryEmbedding = await embedOne(question);
    log(`queryEmbedding: ${JSON.stringify(queryEmbedding)}`);
    console.log("RAG queryEmbedding:", queryEmbedding);
    // 2. pgvector 相似度检索（部门可选）
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
// 过滤低相似度
    const filtered = rows.filter((r) => r.similarity >= 0.5);

    return NextResponse.json({ chunks: filtered });
    // return NextResponse.json({ chunks: rows });
  } catch (err) {
    console.error("[RAG] search failed:", err);
    return NextResponse.json({ error: "search failed" }, { status: 500 });
  }
}


// import { NextRequest, NextResponse } from "next/server";
// import { pool } from "@/lib/db";
// import { embedOne } from "@/lib/embedding";

// export async function POST(req: NextRequest) {
//   const { question, department } = await req.json();
  
//   // 1. 把用户问题向量化
//   const queryEmbedding = await embedOne(question);
  
//   // 2. pgvector 相似度检索（只查该部门的文档）
//   const sql = `
//     SELECT dc.content, sd.title, 1 - (dc.embedding <=> $1::vector) AS similarity
//     FROM document_chunks dc
//     JOIN source_documents sd ON dc.document_id = sd.id
//     JOIN document_departments dd ON dd.document_id = sd.id
//     JOIN departments d ON d.id = dd.department_id
//     WHERE d.code = $2
//     ORDER BY dc.embedding <=> $1::vector
//     LIMIT 5;
//   `;
//   const { rows } = await pool.query(sql, [JSON.stringify(queryEmbedding), department]);
  
//   return NextResponse.json({ chunks: rows });
// }


