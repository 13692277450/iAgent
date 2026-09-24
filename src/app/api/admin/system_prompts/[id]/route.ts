import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const {
    system_prompt_name, system_prompt_content,
    system_prompt_format, is_default,
  } = body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");                    // 👈 开事务

    if (is_default === true) {
      await client.query(                          // 👈 用 client
        `UPDATE system_prompt SET is_default = false WHERE id != $1 AND is_default = true`,
        [id],
      );
    }

    const { rows } = await client.query(           // 👈 用 client
      `UPDATE system_prompt SET
         system_prompt_name=$1, system_prompt_content=$2,
         system_prompt_format=$3, is_default=$4
       WHERE id=$5 RETURNING *`,
      [system_prompt_name, system_prompt_content, system_prompt_format, is_default, id],
    );

    await client.query("COMMIT");                  // 👈 提交
    return NextResponse.json({ systemPrompt: rows[0] });
  } catch (err: any) {
    await client.query("ROLLBACK");                // 👈 出错回滚
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    client.release();                              // 👈 必须释放
  }
}