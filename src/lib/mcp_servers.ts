import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { pool } from "./db";

export type ScpServerRecord = {
  id: number;
  name: string;
  description: string;
  connection_type: string;
  connection_api: string;
  auth_type: string;
  auth_config: string;
  status: string;
  last_error: string;
  permission: string;
  enabled: boolean;
  tools: string;
};

// 1. 查询所有 SCP 服务器列表
export async function listScpServers() {
  const result = await pool.query<ScpServerRecord>(
    `SELECT id, name, description
     FROM public.mcp_server 
     ORDER BY name ASC`
  );
  return result.rows;
}

// 2. 根据 ID 查询单个 MCP 服务器（用于 chat 路由）
export async function getMcpServerById(id: number): Promise<ScpServerRecord | null> {
  const result = await pool.query<ScpServerRecord>(
    `SELECT id, name, description, connection_type, connection_api, auth_type, auth_config, status, last_error, permission, enabled, tools
     FROM public.mcp_server 
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}


