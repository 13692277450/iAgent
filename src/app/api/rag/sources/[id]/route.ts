// app/api/rag/sources/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. 删 chunks（有外键 ON DELETE CASCADE 的话可省略）
    await client.query(`DELETE FROM document_chunks WHERE document_id = $1`, [
      id,
    ]);

    // 2. 删部门关联
    await client.query(
      `DELETE FROM document_departments WHERE document_id = $1`,
      [id],
    );

    // 3. 删源文档
    const { rowCount } = await client.query(
      `DELETE FROM source_documents WHERE id = $1`,
      [id],
    );

    if (rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("[rag/delete] failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
