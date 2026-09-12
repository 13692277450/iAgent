import { NextResponse } from "next/server";
import { listSystemPrompts, SystemPromptRecord } from "@/lib/system_prompt";

export async function GET() {
  try {
    const rows = await listSystemPrompts();
    return NextResponse.json({
      system_prompts: rows.map((row: SystemPromptRecord) => ({
        id: row.id,
        system_prompt_name: row.system_prompt_name,
        system_prompt_content: row.system_prompt_content,
        system_prompt_format: row.system_prompt_format,
        is_default: row.is_default,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch system prompt list:", error);
    return NextResponse.json({ system_prompts: [] }, { status: 500 });
  }
}