import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { embedTexts } from "@/lib/embedding"; // 你的嵌入封装
import { splitChunks } from "@/lib/chunker";
import { parseFile } from "@/lib/parser";     // PDF/DOCX/TXT 解析

export const runtime = "nodejs"; // 需要 Node 运行时操作文件

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const departments = (formData.get("departments") as string)
    ?.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) ?? [];

  if (!files.length) {
    return NextResponse.json({ error: "未选择文件" }, { status: 400 });
  }

  const client = await pool.connect();
  const results: { title: string; chunks: number }[] = [];

  try {
    await client.query("BEGIN");

    for (const file of files) {
      const text = await parseFile(file);
      const chunks = splitChunks(text);
      if (!chunks.length) continue;

      const embeddings = await embedTexts(chunks);

      // 1. 插入源文档
      const { rows } = await client.query(
        `INSERT INTO source_documents (title, doc_type, metadata)
         VALUES ($1, $2, $3) RETURNING id`,
        [
          file.name,
          file.name.split(".").pop() ?? null,
          JSON.stringify({ security_level: "internal" }),
        ],
      );
      const docId = rows[0].id;

      // 2. 关联部门
      for (const code of departments) {
        await client.query(
          `INSERT INTO document_departments (document_id, department_id)
           SELECT $1, id FROM departments WHERE code = $2
           ON CONFLICT DO NOTHING`,
          [docId, code],
        );
      }

      // 3. 批量插入分块 + 向量
      for (let i = 0; i < chunks.length; i++) {
        await client.query(
          `INSERT INTO document_chunks
             (document_id, department, chunk_index, content, embedding)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            docId,
            departments[0] ?? null,
            i,
            chunks[i],
            JSON.stringify(embeddings[i]), // pgvector 接受数组字符串
          ],
        );
      }

      results.push({ title: file.name, chunks: chunks.length });
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  } finally {
    client.release();
  }
}