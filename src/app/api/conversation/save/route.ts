import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getSession();
  const username = session ?? "anonymous";

  try {
    const body = await req.json();
    const { conversationId, model, systemPrompt, messages, forceNew } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    let convId = conversationId;

    // ---------- ① 没有会话或强制新建 → 创建新会话 ----------
    if (!convId || forceNew) {
      const firstUserMsg = messages.find((m: any) => m.role === "user");
      const firstText =
        firstUserMsg?.parts
          ?.filter((p: any) => p.type === "text")
          ?.map((p: any) => p.text)
          ?.join(" ")
          ?.slice(0, 30) || "新对话";

      const { rows } = await pool.query(
        `INSERT INTO conversation (username, title, model, system_prompt)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [username, firstText, model, systemPrompt],
      );
      convId = rows[0].id;
    } else {
      // ---------- ①.5 更新已有会话的标题和元信息 ----------
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      const title =
        lastUserMsg?.parts
          ?.filter((p: any) => p.type === "text")
          ?.map((p: any) => p.text)
          ?.join(" ")
          ?.slice(0, 30) || "对话更新";
      
      await pool.query(
        `UPDATE conversation 
         SET title = $2, model = $3, system_prompt = $4, updated_at = now()
         WHERE id = $1 AND username = $5`,
        [convId, title, model, systemPrompt, username],
      );
    }

    // ---------- ② 先删除旧消息再重新插入（避免重复）----------
    await pool.query(
      `DELETE FROM message WHERE conversation_id = $1`,
      [convId],
    );

    for (const m of messages) {
      const textContent = (m.parts ?? [])
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("\n");

      await pool.query(
        `INSERT INTO message
           (conversation_id, username, role, content, parts, model)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
        [
          convId,
          username,
          m.role,
          textContent,
          JSON.stringify(m.parts ?? []),
          m.role === "assistant" ? model : null,
        ],
      );
    }

    // ---------- ③ 更新会话统计 ----------
    await pool.query(
      `UPDATE conversation
       SET message_count = (SELECT COUNT(*) FROM message WHERE conversation_id = $1),
           updated_at = now()
       WHERE id = $1`,
      [convId],
    );

    return NextResponse.json({ conversationId: convId, ok: true });
  } catch (err) {
    console.error("[save] 失败:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}