import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type NormalizedSkill = {
  name: string;
  display_name: string;
  description: string;
  input_schema: string;
  output_schema: string | null;
  handler_type: string;
  endpoint: string | null;
  handler_ref: string | null;
  auth_type: string | null;
  auth_config: string | null;
  metadata: string | null;
  enabled: boolean;
  is_default: boolean;
};

/**
 * 把不同来源的 Skill 定义归一化成数据库记录。
 * 支持：
 *   - 自定义格式（name + inputSchema + outputSchema）
 *   - OpenAI function calling 格式（type: "function" + function: {...}）
 *   - MCP tool 格式（name + inputSchema）
 *   - 字段名可能是 snake_case 或 camelCase
 */
function normalizeSkill(raw: any): NormalizedSkill | null {
  if (!raw || typeof raw !== "object") return null;

  // OpenAI function calling 格式
  if (raw.type === "function" && raw.function) {
    raw = raw.function;
  }

  const name = raw.name;
  if (!name || typeof name !== "string") return null;

  const inputSchema = raw.inputSchema ?? raw.parameters ?? null;
  const outputSchema = raw.outputSchema ?? raw.returns ?? null;

  // 推断 handler_type
  let handlerType = raw.handler_type ?? raw.handlerType ?? "function";
  let endpoint = raw.endpoint ?? null;
  let handlerRef = raw.handler_ref ?? raw.handlerRef ?? name;

  if (raw.mcp_server || raw.mcpServer) {
    handlerType = "mcp";
    handlerRef = raw.handler_ref ?? raw.mcp_server ?? raw.mcpServer ?? name;
  }
  if (endpoint && handlerType === "function") {
    handlerType = "http";
  }

  return {
    name,
    display_name: raw.displayName ?? raw.display_name ?? name,
    description: raw.description ?? "",
    input_schema: inputSchema
      ? JSON.stringify(inputSchema)
      : JSON.stringify({ type: "object", properties: {} }),
    output_schema: outputSchema ? JSON.stringify(outputSchema) : null,
    handler_type: handlerType,
    endpoint: endpoint,
    handler_ref: handlerRef,
    auth_type: raw.auth_type ?? raw.authType ?? "none",
    auth_config: raw.auth_config
      ? JSON.stringify(raw.auth_config)
      : raw.authConfig
        ? JSON.stringify(raw.authConfig)
        : null,
    metadata: JSON.stringify({
      tags: raw.tags ?? [],
      version: raw.version ?? "1.0",
      category: raw.category ?? null,
    }),
    enabled: raw.enabled === undefined ? true : Boolean(raw.enabled),
    is_default: Boolean(raw.is_default ?? raw.isDefault ?? false),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawSkills = Array.isArray(body) ? body : body.skills;
    if (!Array.isArray(rawSkills)) {
      return NextResponse.json(
        { error: "请求体需要是数组或包含 skills 数组" },
        { status: 400 },
      );
    }

    const results: Array<{
      name: string;
      success: boolean;
      error?: string;
      action?: "created" | "updated";
    }> = [];

    for (const raw of rawSkills) {
      const normalized = normalizeSkill(raw);
      if (!normalized) {
        results.push({
          name: raw?.name ?? "(未知)",
          success: false,
          error: "缺少 name 字段或格式无效",
        });
        continue;
      }

      try {
        // 检查是否已存在同名 Skill
        const existing = await pool.query(
          `SELECT id FROM skill WHERE name = $1 LIMIT 1`,
          [normalized.name],
        );

        if (existing.rows.length > 0) {
          // 已存在则更新
          await pool.query(
            `UPDATE skill SET
               display_name = $2, description = $3,
               input_schema = $4, output_schema = $5,
               handler_type = $6, endpoint = $7, handler_ref = $8,
               auth_type = $9, auth_config = $10, metadata = $11,
               enabled = $12, is_default = $13, updated_at = NOW()
             WHERE id = $1`,
            [
              existing.rows[0].id,
              normalized.display_name,
              normalized.description,
              normalized.input_schema,
              normalized.output_schema,
              normalized.handler_type,
              normalized.endpoint,
              normalized.handler_ref,
              normalized.auth_type,
              normalized.auth_config,
              normalized.metadata,
              normalized.enabled,
              normalized.is_default,
            ],
          );
          results.push({
            name: normalized.name,
            success: true,
            action: "updated",
          });
        } else {
          // 不存在则新建
          await pool.query(
            `INSERT INTO skill
               (name, display_name, description, input_schema, output_schema,
                handler_type, endpoint, handler_ref, auth_type, auth_config,
                metadata, enabled, is_default)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [
              normalized.name,
              normalized.display_name,
              normalized.description,
              normalized.input_schema,
              normalized.output_schema,
              normalized.handler_type,
              normalized.endpoint,
              normalized.handler_ref,
              normalized.auth_type,
              normalized.auth_config,
              normalized.metadata,
              normalized.enabled,
              normalized.is_default,
            ],
          );
          results.push({
            name: normalized.name,
            success: true,
            action: "created",
          });
        }
      } catch (err: any) {
        results.push({
          name: normalized.name,
          success: false,
          error: err.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      total: results.length,
      successCount,
      failCount,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
