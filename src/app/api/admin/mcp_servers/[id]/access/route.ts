import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 列出某个 server 的所有授权
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { rows } = await pool.query(
    `SELECT * FROM mcp_server_access
     WHERE mcp_server_id=$1 AND revoked=false
     ORDER BY granted_at DESC`,
    [id],
  );
  return NextResponse.json({ access: rows });
}

// 授权
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { username, permission = "read", granted_by } = await req.json();

  try {
    const { rows } = await pool.query(
      `INSERT INTO mcp_server_access
         (mcp_server_id, username, permission, granted_by)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (mcp_server_id, username)
       DO UPDATE SET permission=$3, revoked=false, granted_at=now()
       RETURNING *`,
      [id, username, permission, granted_by ?? null],
    );
    return NextResponse.json({ access: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// 撤销
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const accessId = searchParams.get("accessId");

  if (!accessId) {
    return NextResponse.json({ error: "accessId required" }, { status: 400 });
  }

  await pool.query(
    `UPDATE mcp_server_access SET revoked=true WHERE id=$1 AND mcp_server_id=$2`,
    [accessId, id],
  );
  return NextResponse.json({ ok: true });
}