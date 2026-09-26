import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, version, build_time, commit_hash, commit_message
       FROM about ORDER BY id DESC LIMIT 1`,
    );
    const row = rows[0];

    if (!row) {
      return NextResponse.json({ about: null });
    }

    return NextResponse.json({
      about: {
        id: row.id,
        version: row.version,
        buildTime: row.build_time,
        commitHash: row.commit_hash,
        commitMessage: row.commit_message,
      },
    });
  } catch (err) {
    console.error("[about] GET failed:", err);
    return NextResponse.json({ about: null }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const aboutBody = await req.json();
  const currentVersion = "0.0.1";

  try {
    const { rows } = await pool.query(
      `SELECT id, version, build_time, commit_hash, commit_message
       FROM about ORDER BY id DESC LIMIT 1`,
    );
    const row = rows[0];

    if (!row) {
      return NextResponse.json({ error: "About not found" }, { status: 404 });
    }

    if (row.version > currentVersion) {
      return NextResponse.json({
        about: {
          id: row.id,
          version: row.version,
          buildTime: row.build_time,
          commitHash: row.commit_hash,
          commitMessage: row.commit_message,
        },
      });
    }

    return NextResponse.json({
      about: {
        id: 0,
        version: aboutBody.version,
        buildTime: aboutBody.buildTime,
        commitHash: aboutBody.commitHash,
        commitMessage: aboutBody.commitMessage,
      },
    });
  } catch (err) {
    console.error("[about] POST failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
