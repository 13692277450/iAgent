import { NextRequest, NextResponse } from "next/server";
import { listRAGSources } from "@/lib/rag";
import { getSessionDepartment } from "@/lib/auth"; // 你的鉴权封装
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const department = await getSessionDepartment(req); // 从会话解析当前部门
  // const sources = await listRAGSources(undefined);  //Test purpose.

  const sources = await listRAGSources(department);
  return NextResponse.json({ sources });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  // 兼容旧的全局 departments
  const globalDepartments =
    (formData.get("departments") as string)
      ?.split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean) ?? [];

  // ...

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // 👇 优先取该文件自己的部门
    const perFileDepts =
      (formData.get(`departments_${file.name}`) as string)
        ?.split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean) ?? [];

    const departments =
      perFileDepts.length > 0 ? perFileDepts : globalDepartments;

    // ... 后续用 departments 处理这个文件
  }
}
