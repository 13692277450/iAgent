import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const { rows } = await pool.query(
    `SELECT * FROM skill ORDER BY id DESC`,
  );
  return NextResponse.json({ skills: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name, display_name, description, input_schema, output_schema,
    handler_type, endpoint, handler_ref, auth_type, auth_config,
    metadata, enabled = true, is_default = false,
  } = body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO skill
         (name, display_name, description, input_schema, output_schema,
          handler_type, endpoint, handler_ref, auth_type, auth_config,
          metadata, enabled, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        name, display_name, description,
        JSON.stringify(input_schema ?? { type: "object", properties: {} }),
        output_schema ? JSON.stringify(output_schema) : null,
        handler_type, endpoint, handler_ref, auth_type,
        auth_config ? JSON.stringify(auth_config) : null,
        metadata ? JSON.stringify(metadata) : null,
        enabled, is_default,
      ],
    );
    return NextResponse.json({ skill: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}