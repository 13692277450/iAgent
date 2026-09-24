import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const { rows } = await pool.query(
    `SELECT code, name FROM departments WHERE is_active = true ORDER BY code`,
  );
  return NextResponse.json({ departments: rows });
}