import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const { rows } = await pool.query(
    `SELECT * FROM system_prompt ORDER BY id DESC`,
  );
  return NextResponse.json({ systemPrompts: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    system_prompt_name,
    system_prompt_content,
    system_prompt_format,
    is_default = false,
  } = body;

  const { rows } = await pool.query(
    `INSERT INTO system_prompt
       (system_prompt_name, system_prompt_content, system_prompt_format, is_default)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [system_prompt_name, system_prompt_content, system_prompt_format, is_default],
  );
  return NextResponse.json({ systemPrompt: rows[0] });
}