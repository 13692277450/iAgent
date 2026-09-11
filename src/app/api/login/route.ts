import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { setSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "账号和密码不能为空" },
        { status: 400 },
      );
    }

    // 1. 查询账号
    const result = await pool.query(
      `SELECT id, username, password, islocker 
       FROM public.account 
       WHERE username = $1`,
      [username],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
    }

    const account = result.rows[0];

    // 2. 检查是否被锁定
    if (account.islocker === true) {
      return NextResponse.json(
        { error: "账号被锁定，请联系管理员" },
        { status: 403 },
      );
    }

    // 3. 校验密码（这里演示用明文比较，生产环境务必用 bcrypt 哈希）
    if (account.password !== password) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
    }

    // 4. 写入 session cookie
    await setSession(account.username);

    return NextResponse.json({ success: true, username: account.username });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
