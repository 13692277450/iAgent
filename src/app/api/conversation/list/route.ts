import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  const username = session ?? "anonymous";

  try {
    const { rows } = await pool.query(
      `SELECT id, title, model, system_prompt, message_count, created_at, updated_at
       FROM conversation
       WHERE username = $1 AND archived = FALSE
       ORDER BY updated_at DESC
       LIMIT 50`,
      [username],
    );
    return NextResponse.json({ conversations: rows });
  } catch (err) {
    console.error("[list] 失败:", err);
    return NextResponse.json({ conversations: [] }, { status: 500 });
  }
}