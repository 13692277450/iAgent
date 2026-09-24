import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const {
    name, description, connection_type, connection_api,
    auth_type, auth_config, permission, enabled, tools,
  } = body;

  try {
    const { rows } = await pool.query(
      `UPDATE mcp_server SET
         name=$1, description=$2, connection_type=$3, connection_api=$4,
         auth_type=$5, auth_config=$6, permission=$7, enabled=$8, tools=$9
       WHERE id=$10
       RETURNING *`,
      [
        name, description, connection_type,
        JSON.stringify(connection_api ?? {}),
        auth_type,
        auth_config ? JSON.stringify(auth_config) : null,
        permission, enabled,
        JSON.stringify(tools ?? []),
        id,
      ],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ mcpServer: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await pool.query(`DELETE FROM mcp_server WHERE id=$1`, [id]);
  return NextResponse.json({ ok: true });
}