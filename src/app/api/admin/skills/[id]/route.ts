import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const {
    name,
    display_name,
    description,
    input_schema,
    output_schema,
    handler_type,
    endpoint,
    handler_ref,
    auth_type,
    auth_config,
    metadata,
    enabled,
    is_default,
  } = body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // 👈 开事务

    if (is_default === true) {
      await client.query(
        // 👈 用 client
        `UPDATE skill SET is_default = false WHERE id != $1 AND is_default = true`,
        [id],
      );
    }

    try {
      const { rows } = await pool.query(
        `UPDATE skill SET
         name=$1, display_name=$2, description=$3,
         input_schema=$4, output_schema=$5, handler_type=$6,
         endpoint=$7, handler_ref=$8, auth_type=$9, auth_config=$10,
         metadata=$11, enabled=$12, is_default=$13, updated_at=now()
       WHERE id=$14
       RETURNING *`,
        [
          name,
          display_name,
          description,
          JSON.stringify(input_schema ?? {}),
          output_schema ? JSON.stringify(output_schema) : null,
          handler_type,
          endpoint,
          handler_ref,
          auth_type,
          auth_config ? JSON.stringify(auth_config) : null,
          metadata ? JSON.stringify(metadata) : null,
          enabled,
          is_default,
          id,
        ],
      );
      await client.query("COMMIT");
      if (rows.length === 0) {
        return NextResponse.json({ error: "not found" }, { status: 404 });
      }
      return NextResponse.json({ skill: rows[0] });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    // 👈 提交
  } catch (err: any) {
    await client.query("ROLLBACK"); // 👈 出错回滚
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    client.release(); // 👈 必须释放
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await pool.query(`DELETE FROM skill WHERE id=$1`, [id]);
  return NextResponse.json({ ok: true });
}
