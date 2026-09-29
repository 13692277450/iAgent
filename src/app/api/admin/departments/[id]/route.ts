import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.departments.getById(id);
    if (!existing) {
      return NextResponse.json({ error: "部门不存在" }, { status: 404 });
    }

    // 改了代码时，检查是否和其他部门冲突
    if (body.code && body.code !== existing.code) {
      const dup = await db.departments.findByCode(body.code);
      if (dup && String(dup.id) !== String(id)) {
        return NextResponse.json({ error: "部门代码已存在" }, { status: 409 });
      }
    }

    const updated = await db.departments.update(id, {
      code: body.code ?? existing.code,
      name: body.name ?? existing.name,
      short_name:
        body.short_name === undefined ? existing.short_name : body.short_name,
      parent_id:
        body.parent_id === undefined ? existing.parent_id : body.parent_id,
      manager: body.manager === undefined ? existing.manager : body.manager,
      description:
        body.description === undefined
          ? existing.description
          : body.description,
      is_active:
        body.is_active === undefined
          ? existing.is_active
          : Boolean(body.is_active),
    });

    return NextResponse.json({
      department: {
        id: updated!.id,
        code: updated!.code,
        name: updated!.name,
        short_name: updated!.short_name,
        parent_id: updated!.parent_id,
        manager: updated!.manager,
        description: updated!.description,
        is_active: Boolean(updated!.is_active),
      },
    });
  } catch (err) {
    console.error("[departments] PUT failed:", err);
    return NextResponse.json({ error: "更新部门失败" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await db.departments.getById(id);
    if (!existing) {
      return NextResponse.json({ error: "部门不存在" }, { status: 404 });
    }

    // 如果有账号还在引用这个部门，禁止删除
    const accounts = await db.accounts.all();
    const inUse = accounts.some(
      (a) =>
        String(a.department ?? "").toUpperCase() ===
        String(existing.code ?? "").toUpperCase(),
    );
    if (inUse) {
      return NextResponse.json(
        { error: "该部门下还有账号，无法删除" },
        { status: 409 },
      );
    }

    await db.departments.remove(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[departments] DELETE failed:", err);
    return NextResponse.json({ error: "删除部门失败" }, { status: 500 });
  }
}
