import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 👇 用原始 console，避免被拦截
const originalLog = console.log.bind(console);
const originalError = console.error.bind(console);

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.LOG_API_TOKEN;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { logs } = await req.json();

  if (!Array.isArray(logs) || logs.length === 0) {
    return NextResponse.json({ ok: true, count: 0 });
  }

  try {
    const values: any[] = [];
    const placeholders: string[] = [];

    logs.forEach((l: any, i: number) => {
      const b = i * 6;
      placeholders.push(
        `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6})`,
      );
      values.push(
        l.source ?? "unknown",
        l.level,
        l.text,
        l.args ? JSON.stringify(l.args) : null,
        l.context ? JSON.stringify(l.context) : null,
        new Date(l.timestamp),
      );
    });

    await pool.query(
      `INSERT INTO app_log (source, level, text, args, context, created_at)
       VALUES ${placeholders.join(",")}`,
      values,
    );

    return NextResponse.json({ ok: true, count: logs.length });
  } catch (err: any) {
    // 👇 用原始 console.error
    originalError("[logs] insert failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
