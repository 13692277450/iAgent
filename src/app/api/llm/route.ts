import { NextResponse } from "next/server";
import { listLlms } from "@/lib/llm";

export async function GET() {
  try {
    const rows = await listLlms();
    return NextResponse.json({
      models: rows.map((row) => ({
        id: row.id,
        name: row.llm_name,
        model: row.llm_model,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch llm list:", error);
    return NextResponse.json({ models: [] }, { status: 500 });
  }
}