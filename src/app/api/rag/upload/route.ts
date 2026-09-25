// app/api/rag/upload/route.ts
import { NextRequest } from "next/server";
import { parseFile } from "@/lib/parser";
import { splitChunks } from "@/lib/chunker";
import { embedTexts } from "@/lib/embedding";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const departments =
    (formData.get("departments") as string)
      ?.split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean) ?? [];

  if (!files.length) {
    return new Response(JSON.stringify({ error: "未选择文件" }), {
      status: 400,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      try {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileIndex = i + 1;
            const total = files.length;

            // 👇 1. 解析
            send({
              type: "progress",
              step: "parse",
              file: file.name,
              fileIndex,
              total,
              message: `正在解析 ${file.name}`,
            });

            const text = await parseFile(file);

            // 👇 2. 分块
            send({
              type: "progress",
              step: "chunk",
              file: file.name,
              fileIndex,
              total,
              message: `正在分块 ${file.name}`,
            });

            const chunks = splitChunks(text);
            send({
              type: "progress",
              step: "chunk-done",
              file: file.name,
              fileIndex,
              total,
              chunks: chunks.length,
              message: `${file.name} 分成 ${chunks.length} 块`,
            });

            if (!chunks.length) continue;

            // 👇 3. 向量化
            send({
              type: "progress",
              step: "embed",
              file: file.name,
              fileIndex,
              total,
              chunks: chunks.length,
              message: `正在向量化 ${file.name}（${chunks.length} 块）`,
            });

            const embeddings = await embedTexts(chunks);

            // 👇 4. 写库
            send({
              type: "progress",
              step: "insert",
              file: file.name,
              fileIndex,
              total,
              message: `正在写入数据库 ${file.name}`,
            });

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

            for (const code of departments) {
              await client.query(
                `INSERT INTO document_departments (document_id, department_id)
                 SELECT $1, id FROM departments WHERE code = $2
                 ON CONFLICT DO NOTHING`,
                [docId, code],
              );
            }

            for (let j = 0; j < chunks.length; j++) {
              await client.query(
                `INSERT INTO document_chunks
                   (document_id, department, chunk_index, content, embedding)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                  docId,
                  departments[0] ?? null,
                  j,
                  chunks[j],
                  JSON.stringify(embeddings[j]),
                ],
              );
            }

            send({
              type: "progress",
              step: "file-done",
              file: file.name,
              fileIndex,
              total,
              chunks: chunks.length,
              message: `${file.name} 完成`,
            });
          }

          await client.query("COMMIT");

          send({
            type: "done",
            total: files.length,
            message: `全部完成，共处理 ${files.length} 个文件`,
          });
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      } catch (err: any) {
        send({ type: "error", message: err.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

//before display upload RAG status and steps

// import { NextRequest, NextResponse } from "next/server";
// import { pool } from "@/lib/db";
// import { embedTexts } from "@/lib/embedding"; // 你的嵌入封装
// import { splitChunks } from "@/lib/chunker";
// import { parseFile } from "@/lib/parser";     // PDF/DOCX/TXT 解析

// export const runtime = "nodejs"; // 需要 Node 运行时操作文件

// export async function POST(req: NextRequest) {
//   const formData = await req.formData();
//   const files = formData.getAll("files") as File[];
//   const departments = (formData.get("departments") as string)
//     ?.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) ?? [];

//   if (!files.length) {
//     return NextResponse.json({ error: "未选择文件" }, { status: 400 });
//   }

//   const client = await pool.connect();
//   const results: { title: string; chunks: number }[] = [];

//   try {
//     await client.query("BEGIN");

//     for (const file of files) {
//       const text = await parseFile(file);
//       const chunks = splitChunks(text);
//       if (!chunks.length) continue;

//       const embeddings = await embedTexts(chunks);

//       // 1. 插入源文档
//       const { rows } = await client.query(
//         `INSERT INTO source_documents (title, doc_type, metadata)
//          VALUES ($1, $2, $3) RETURNING id`,
//         [
//           file.name,
//           file.name.split(".").pop() ?? null,
//           JSON.stringify({ security_level: "internal" }),
//         ],
//       );
//       const docId = rows[0].id;

//       // 2. 关联部门
//       for (const code of departments) {
//         await client.query(
//           `INSERT INTO document_departments (document_id, department_id)
//            SELECT $1, id FROM departments WHERE code = $2
//            ON CONFLICT DO NOTHING`,
//           [docId, code],
//         );
//       }

//       // 3. 批量插入分块 + 向量
//       for (let i = 0; i < chunks.length; i++) {
//         await client.query(
//           `INSERT INTO document_chunks
//              (document_id, department, chunk_index, content, embedding)
//            VALUES ($1, $2, $3, $4, $5)`,
//           [
//             docId,
//             departments[0] ?? null,
//             i,
//             chunks[i],
//             JSON.stringify(embeddings[i]), // pgvector 接受数组字符串
//           ],
//         );
//       }

//       results.push({ title: file.name, chunks: chunks.length });
//     }

//     await client.query("COMMIT");
//     return NextResponse.json({ ok: true, results });
//   } catch (err) {
//     await client.query("ROLLBACK");
//     console.error(err);
//     return NextResponse.json({ error: "上传失败" }, { status: 500 });
//   } finally {
//     client.release();
//   }
// }
