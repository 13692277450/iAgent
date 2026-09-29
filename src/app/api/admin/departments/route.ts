import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rows = await db.departments.all();
    return NextResponse.json({
      departments: rows.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        short_name: d.short_name,
        parent_id: d.parent_id,
        manager: d.manager,
        description: d.description,
        is_active: Boolean(d.is_active),
        created_at: d.created_at,
        updated_at: d.updated_at,
      })),
    });
  } catch (err) {
    console.error("[departments] GET failed:", err);
    return NextResponse.json({ departments: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.code || !body.name) {
      return NextResponse.json(
        { error: "部门代码和名称不能为空" },
        { status: 400 },
      );
    }

    // 部门代码唯一性校验
    const existing = await db.departments.findByCode(body.code);
    if (existing) {
      return NextResponse.json({ error: "部门代码已存在" }, { status: 409 });
    }

    const created = await db.departments.insert({
      code: body.code,
      name: body.name,
      short_name: body.short_name ?? null,
      parent_id: body.parent_id ?? null,
      manager: body.manager ?? null,
      description: body.description ?? null,
      is_active: body.is_active === undefined ? true : Boolean(body.is_active),
    });

    return NextResponse.json({
      department: {
        id: created.id,
        code: created.code,
        name: created.name,
        short_name: created.short_name,
        parent_id: created.parent_id,
        manager: created.manager,
        description: created.description,
        is_active: Boolean(created.is_active),
      },
    });
  } catch (err) {
    console.error("[departments] POST failed:", err);
    return NextResponse.json({ error: "创建部门失败" }, { status: 500 });
  }
}
