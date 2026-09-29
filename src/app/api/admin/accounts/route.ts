import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rows = await db.accounts.all();
    return NextResponse.json({
      accounts: rows.map((a) => ({
        id: a.id,
        username: a.username,
        password: a.password,
        department: a.department,
        islocker: Boolean(a.islocker),
        isAdmin: Boolean(a.isAdmin),
      })),
    });
  } catch (err) {
    console.error("[accounts] GET failed:", err);
    return NextResponse.json({ accounts: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 },
      );
    }

    // 用户名唯一性校验
    const existing = await db.accounts.findByUsername(body.username);
    if (existing) {
      return NextResponse.json({ error: "用户名已存在" }, { status: 409 });
    }

    const created = await db.accounts.insert({
      username: body.username,
      password: body.password,
      department: body.department ?? null,
      islocker: Boolean(body.islocker),
      isAdmin: Boolean(body.isAdmin),
    });

    return NextResponse.json({
      account: {
        id: created.id,
        username: created.username,
        password: created.password,
        department: created.department,
        islocker: Boolean(created.islocker),
        isAdmin: Boolean(created.isAdmin),
      },
    });
  } catch (err) {
    console.error("[accounts] POST failed:", err);
    return NextResponse.json({ error: "创建账号失败" }, { status: 500 });
  }
}
