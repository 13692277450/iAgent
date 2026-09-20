// lib/parser.ts
import { readFile } from "fs/promises";
import { PDFParse } from "pdf-parse";
import { getPath } from "pdf-parse/worker";

/**
 * 统一解析入口：根据文件扩展名分发到对应解析器。
 * 接收 Next.js 的 File 对象，返回纯文本。
 */
export async function parseFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const buffer = Buffer.from(await file.arrayBuffer());

  switch (ext) {
    case "txt":
    case "md":
      return buffer.toString("utf-8");

    case "pdf":
      return parsePDF(buffer);

    case "docx":
      return parseDOCX(buffer);

    default:
      throw new Error(`不支持的文件类型：.${ext}`);
  }
}

// ---------- PDF ----------

// 设置 worker 路径
PDFParse.setWorker(getPath());

async function parsePDF(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}
// ---------- DOCX ----------
async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}