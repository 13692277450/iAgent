import { NextResponse } from "next/server";
import { listLlms } from "@/lib/llm";

export async function GET() {
  try {
    const rows = await listLlms();
    return NextResponse.json({
      models: rows.map((row) => ({
        id: row.id,
        llm_name: row.llm_name,
        llm_apiKey: row.llm_apikey,
        llm_baseUrl: row.llm_baseurl,
        llm_model: row.llm_model,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch llm list:", error);
    return NextResponse.json({ models: [] }, { status: 500 });
  }
}