import {NextResponse} from "next/server";
import {pool} from "@/lib/db";



export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, display_name, description, handler_type,
              auth_type, enabled, is_default, input_schema, output_schema,
              endpoint, handler_ref, metadata
       FROM public.skill
       WHERE enabled = TRUE
       ORDER BY name ASC`,
    );
    return NextResponse.json({ skills: rows });
  } catch (err) {
    console.error("Failed to fetch skills:", err);
    return NextResponse.json({ skills: [] }, { status: 500 });
  }
}