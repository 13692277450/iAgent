import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.accounts.getById(id);
    if (!existing) {
      return NextResponse.json({ error: "账号不存在" }, { status: 404 });
    }

    // 改了用户名时，检查是否和其他账号冲突
    if (body.username && body.username !== existing.username) {
      const dup = await db.accounts.findByUsername(body.username);
      if (dup && String(dup.id) !== String(id)) {
        return NextResponse.json({ error: "用户名已存在" }, { status: 409 });
      }
    }

    const updated = await db.accounts.update(id, {
      username: body.username ?? existing.username,
      password: body.password ?? existing.password,
      department: body.department ?? existing.department,
      islocker:
        body.islocker === undefined
          ? existing.islocker
          : Boolean(body.islocker),
      isAdmin:
        body.isAdmin === undefined ? existing.isAdmin : Boolean(body.isAdmin),
    });

    return NextResponse.json({
      account: {
        id: updated!.id,
        username: updated!.username,
        password: updated!.password,
        department: updated!.department,
        islocker: Boolean(updated!.islocker),
        isAdmin: Boolean(updated!.isAdmin),
      },
    });
  } catch (err) {
    console.error("[accounts] PUT failed:", err);
    return NextResponse.json({ error: "更新账号失败" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await db.accounts.getById(id);
    if (!existing) {
      return NextResponse.json({ error: "账号不存在" }, { status: 404 });
    }

    await db.accounts.remove(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[accounts] DELETE failed:", err);
    return NextResponse.json({ error: "删除账号失败" }, { status: 500 });
  }
}
