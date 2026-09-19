import { NextRequest, NextResponse } from "next/server";
import { listRAGSources } from "@/lib/rag";
import { getSessionDepartment } from "@/lib/auth"; // 你的鉴权封装

export async function GET(req: NextRequest) {
  const department = await getSessionDepartment(req); // 从会话解析当前部门
    // const sources = await listRAGSources(undefined);  //Test purpose.

  const sources = await listRAGSources(department);
  return NextResponse.json({ sources });
}