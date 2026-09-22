import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const username = session?.username ?? "anonymous";
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

    console.log(`[API/${id}] 查询到 ${msgRows.length} 条消息`);

    // ✅ 返回完整数据，包括 content 字段
    const result = {
      conversation: convRows[0],
      messages: msgRows.map((r: any, index: number) => {
        console.log(`[API/${id}] 消息 ${index}:`, {
          id: r.id,
          role: r.role,
          hasContent: !!r.content,
          contentLength: r.content?.length || 0,
          hasParts: !!r.parts,
          partsType: typeof r.parts,
        });
        
        return {
          id: String(r.id),
          role: r.role,
          content: r.content || "",  // ✅ 确保返回 content
          parts: r.parts || [],      // ✅ 确保 parts 是数组
        };
      }),
    };

    console.log(`[API/${id}] 最终返回:`, JSON.stringify(result.messages[0], null, 2));
    
    return NextResponse.json(result);
  } catch (err) {
    console.error("[load] 失败:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ==================== 删除会话 =====================
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const username = session?.username ?? "anonymous";
  const { id } = await params;

  try {
    const { rows: convRows } = await pool.query(
      `SELECT id FROM conversation WHERE id = $1 AND username = $2`,
      [id, username],
    );
    if (convRows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await pool.query(`DELETE FROM message WHERE conversation_id = $1`, [id]);
    await pool.query(`DELETE FROM conversation WHERE id = $1`, [id]);

    return NextResponse.json({ ok: true, deletedId: Number(id) });
  } catch (err) {
    console.error("[delete] 失败:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}


// import { NextResponse } from "next/server";
// import { getSession } from "@/lib/auth";
// import { pool } from "@/lib/db";

// export async function GET(
//   _req: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   const session = await getSession();
//   const username = session ?? "anonymous";
//   const { id } = await params;

//   try {
//     // ① 查会话头
//     const { rows: convRows } = await pool.query(
//       `SELECT * FROM conversation WHERE id = $1 AND username = $2`,
//       [id, username],
//     );
//     if (convRows.length === 0) {
//       return NextResponse.json({ error: "Not found" }, { status: 404 });
//     }

//     // ② 查消息（按时间正序）
//     const { rows: msgRows } = await pool.query(
//       `SELECT id, role, content, parts, model, created_at
//        FROM message
//        WHERE conversation_id = $1
//        ORDER BY created_at ASC`,
//       [id],
//     );

//     // ✅ 修复：返回时包含 content 字段！
//     return NextResponse.json({
//       conversation: convRows[0],
//       messages: msgRows.map((r) => ({
//         id: String(r.id),
//         role: r.role,
//         content: r.content,  // ← 新增：返回 content 字段
//         parts: r.parts,
//       })),
//     });
//   } catch (err) {
//     console.error("[load] 失败:", err);
//     return NextResponse.json({ error: String(err) }, { status: 500 });
//   }
// }

// // ==================== 删除会话（含关联消息）====================
// export async function DELETE(
//   _req: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   const session = await getSession();
//   const username = session ?? "anonymous";
//   const { id } = await params;

//   try {
//     // 先校验归属权
//     const { rows: convRows } = await pool.query(
//       `SELECT id FROM conversation WHERE id = $1 AND username = $2`,
//       [id, username],
//     );
//     if (convRows.length === 0) {
//       return NextResponse.json({ error: "Not found" }, { status: 404 });
//     }

//     // 删除关联消息（外键约束可能已级联，显式删更安全）
//     await pool.query(`DELETE FROM message WHERE conversation_id = $1`, [id]);

//     // 删除会话本身
//     await pool.query(`DELETE FROM conversation WHERE id = $1`, [id]);

//     return NextResponse.json({ ok: true, deletedId: Number(id) });
//   } catch (err) {
//     console.error("[delete] 失败:", err);
//     return NextResponse.json({ error: String(err) }, { status: 500 });
//   }
// }