// src/app/api/mcp/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, connection_type, status, enabled, tools
       FROM public.mcp_server
       ORDER BY name ASC`,
    );
    return NextResponse.json({ servers: rows });
  } catch (err) {
    console.error("Failed to fetch mcp servers:", err);
    return NextResponse.json({ servers: [] }, { status: 500 });
  }
}