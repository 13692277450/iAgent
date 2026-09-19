import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const username = session ?? "anonymous";
  const { id } = await params;

  try {
    // ① 查会话头
    const { rows: convRows } = await pool.query(
      `SELECT * FROM conversation WHERE id = $1 AND username = $2`,
      [id, username],
    );
    if (convRows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ② 查消息（按时间正序）
    const { rows: msgRows } = await pool.query(
      `SELECT id, role, content, parts, model, created_at
       FROM message
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [id],
    );

    return NextResponse.json({
      conversation: convRows[0],
      messages: msgRows.map((r) => ({
        id: String(r.id),
        role: r.role,
        parts: r.parts,
      })),
    });
  } catch (err) {
    console.error("[load] 失败:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  
}


// ==================== 删除会话（含关联消息）====================
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const username = session ?? "anonymous";
  const { id } = await params;

  try {
    // 先校验归属权
    const { rows: convRows } = await pool.query(
      `SELECT id FROM conversation WHERE id = $1 AND username = $2`,
      [id, username],
    );
    if (convRows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 删除关联消息（外键约束可能已级联，显式删更安全）
    await pool.query(`DELETE FROM message WHERE conversation_id = $1`, [id]);

    // 删除会话本身
    await pool.query(`DELETE FROM conversation WHERE id = $1`, [id]);

    return NextResponse.json({ ok: true, deletedId: Number(id) });
  } catch (err) {
    console.error("[delete] 失败:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}