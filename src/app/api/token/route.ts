import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTokenUsageByUser } from "@/lib/token";

export async function GET() {
  try {
    const username = await getSession();
    if (!username) {
      return NextResponse.json({ usage: [] }, { status: 401 });
    }

    const rows = await getTokenUsageByUser(username);
    const usageMap: Record<string, number> = {};
    rows.forEach((r) => {
      usageMap[r.update_date] = r.total_tokens;
    });

    return NextResponse.json({ usage: usageMap });
  } catch (error) {
    console.error("Failed to fetch token usage:", error);
    return NextResponse.json({ usage: {} }, { status: 500 });
  }
}