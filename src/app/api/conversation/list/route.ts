import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSession();
  const username = session?.username ?? "anonymous";

  try {
    const { rows } = await pool.query(
      `SELECT 
        c.id,
        c.title,
        c.model,
        c.system_prompt,
        c.message_count,
        c.created_at,
        c.updated_at,
        (SELECT content FROM message 
         WHERE conversation_id = c.id 
         AND role = 'user' 
         ORDER BY created_at DESC 
         LIMIT 1) as last_message
       FROM conversation c
       WHERE c.username = $1 
         AND c.archived = false
       ORDER BY c.updated_at DESC
       LIMIT 50`,
      [username],
    );

    return NextResponse.json({
      conversations: rows.map((r: any) => ({
        id: r.id,
        title: r.title || "新对话",
        model: r.model,
        system_prompt: r.system_prompt,
        message_count: r.message_count || 0,
        updated_at: r.updated_at,
        last_message: r.last_message?.substring(0, 100) || "",
      })),
    });
  } catch (err) {
    console.error("[list] 失败:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// import { NextResponse } from "next/server";
// import { getSession } from "@/lib/auth";
// import { pool } from "@/lib/db";

// export async function GET() {
//   const session = await getSession();
//   const username = session ?? "anonymous";

//   try {
//     const { rows } = await pool.query(
//       `SELECT id, title, model, system_prompt, message_count, created_at, updated_at
//        FROM conversation
//        WHERE username = $1 AND archived = FALSE
//        ORDER BY updated_at DESC
//        LIMIT 50`,
//       [username],
//     );
//     return NextResponse.json({ conversations: rows });
//   } catch (err) {
//     console.error("[list] 失败:", err);
//     return NextResponse.json({ conversations: [] }, { status: 500 });
//   }
// }