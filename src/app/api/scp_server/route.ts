import { NextResponse } from "next/server";
import { listScpServers, ScpServerRecord } from "@/lib/mcp_servers";

export async function GET() {
  try {
    const rows = await listScpServers();
    return NextResponse.json({
      mcp_servers: rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        connection_type: row.connection_type,
        connection_api: row.connection_api,
        auth_type: row.auth_type,
        auth_config: row.auth_config,
        status: row.status,
        last_error: row.last_error,
        permission: row.permission,
        enabled: row.enabled,
        tools: row.tools,
        created_at: row.created_at,
        

      })),
    });
  } catch (error) {
    console.error("Failed to fetch scp server list:", error);
    return NextResponse.json({ servers: [] }, { status: 500 });
  }
}
