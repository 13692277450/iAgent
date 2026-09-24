import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUsername } from "@/lib/auth";

export async function GET() {
  const { rows } = await pool.query(
    `SELECT * FROM llm ORDER BY id DESC`,
  );
  return NextResponse.json({ llms: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    llm_name, llm_apikey, llm_baseurl, llm_model, is_default = false,
  } = body;

  const username = await getCurrentUsername();
  if (!username) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO llm
         (llm_name, llm_apikey, llm_baseurl, llm_model, username, is_default)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [llm_name, llm_apikey, llm_baseurl, llm_model, username, is_default],
    );
    return NextResponse.json({ llm: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}