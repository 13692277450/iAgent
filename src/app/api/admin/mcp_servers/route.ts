import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const { rows } = await pool.query(
    `SELECT * FROM mcp_server ORDER BY id DESC`,
  );
  return NextResponse.json({ mcpServers: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name, description, connection_type, connection_api,
    auth_type = "none", auth_config, permission = "read",
    enabled = false, tools = [],
  } = body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO mcp_server
         (name, description, connection_type, connection_api,
          auth_type, auth_config, permission, enabled, tools)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        name, description, connection_type,
        JSON.stringify(connection_api ?? {}),
        auth_type,
        auth_config ? JSON.stringify(auth_config) : null,
        permission, enabled,
        JSON.stringify(tools),
      ],
    );
    return NextResponse.json({ mcpServer: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}