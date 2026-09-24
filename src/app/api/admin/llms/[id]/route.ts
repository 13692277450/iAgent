import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { llm_name, llm_apikey, llm_baseurl, llm_model, is_default } = body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // 👈 开事务

    if (is_default === true) {
      await client.query(
        // 👈 用 client
        `UPDATE llm SET is_default = false WHERE id != $1 AND is_default = true`,
        [id],
      );
    }

    const { rows } = await client.query(
      `UPDATE llm SET
       llm_name=$1, llm_apikey=$2, llm_baseurl=$3, llm_model=$4, is_default=$5
     WHERE id=$6 RETURNING *`,
      [llm_name, llm_apikey, llm_baseurl, llm_model, is_default, id],
    );
    await client.query("COMMIT");
    return NextResponse.json({ llm: rows[0] });
  } catch (err: any) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    await client.release();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await pool.query(`DELETE FROM llm WHERE id=$1`, [id]);
  return NextResponse.json({ ok: true });
}
