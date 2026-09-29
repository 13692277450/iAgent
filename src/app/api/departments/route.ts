import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const { rows } = await pool.query(
    `SELECT code, name FROM departments WHERE is_active = true ORDER BY code`,
  );
  return NextResponse.json({ departments: rows });
}

// import { NextResponse } from "next/server";
// import { db } from "@/lib/db";

// export async function GET() {
//   // 原 SQL: SELECT code, name FROM departments WHERE is_active = true ORDER BY code
//   const rows = await db.departments.listActive();
//   return NextResponse.json({
//     departments: rows.map((row) => ({ code: row.code, name: row.name })),
//   });
