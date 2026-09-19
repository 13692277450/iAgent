// src/lib/skill-tools.ts
import { tool } from "ai";
import { z } from "zod";

export type SkillRow = {
  id: number;
  name: string;
  display_name: string | null;
  description: string;
  input_schema: unknown;
  output_schema?: unknown;
  handler_type: string;          // http / function / mcp
  endpoint: string | null;       // handler_type=http 时的 URL
  handler_ref: string | null;    // handler_type=function 时的函数名
  auth_type: string | null;      // none / api_key / bearer / basic
  auth_config: Record<string, any> | null;
  metadata?: Record<string, any> | null;
};

// ---------- 认证解析（和 MCP 一样）----------
function resolveAuth(skill: SkillRow): Record<string, string> {
  if (skill.auth_type === "none" || !skill.auth_config) return {};
  const cfg = skill.auth_config;

  switch (skill.auth_type) {
    case "bearer": {
      const token = cfg.token_env ? process.env[cfg.token_env] : cfg.token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
    case "api_key": {
      const key = cfg.key_env ? process.env[cfg.key_env] : cfg.key;
      const header = cfg.header ?? "X-API-Key";
      return key ? { [header]: key } : {};
    }
    case "basic": {
      const user = cfg.user_env ? process.env[cfg.user_env] : cfg.user;
      const pass = cfg.pass_env ? process.env[cfg.pass_env] : cfg.pass;
      if (!user || !pass) return {};
      return {
        Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`,
      };
    }
    default:
      return {};
  }
}

// ---------- 按 handler_type 分派调用 ----------
async function callSkill(skill: SkillRow, args: unknown): Promise<unknown> {
  switch (skill.handler_type) {
    // ---------- HTTP：直接 POST 到 endpoint ----------
    case "http": {
      if (!skill.endpoint) {
        throw new Error(`Skill ${skill.name} 缺少 endpoint`);
      }
      const auth = resolveAuth(skill);
      const res = await fetch(skill.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...auth,
        },
        body: JSON.stringify(args),
      });
      if (!res.ok) {
        throw new Error(
          `Skill ${skill.name} HTTP ${res.status}: ${await res.text()}`,
        );
      }
      // 尝试解析 JSON，失败就返回文本
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    // ---------- function：调本地函数 ----------
    case "function": {
      if (!skill.handler_ref) {
        throw new Error(`Skill ${skill.name} 缺少 handler_ref`);
      }
      // 🚨 动态 import 本地 handler 模块
      const handlers = await import("@/lib/skill_handler");
      const fn = (handlers as any)[skill.handler_ref];
      if (typeof fn !== "function") {
        throw new Error(
          `Skill ${skill.name} 的 handler "${skill.handler_ref}" 不存在`,
        );
      }
      return await fn(args);
    }

    // ---------- mcp：走 MCP server ----------
    case "mcp": {
      // handler_ref 指向 mcp_server.name，endpoint 指向 MCP 的 URL
      // 这里简单转发，更完整的实现可复用 mcp-tools.ts 的 callMcpServer
      if (!skill.endpoint) {
        throw new Error(`Skill ${skill.name} (mcp) 缺少 endpoint`);
      }
      const auth = resolveAuth(skill);
      const res = await fetch(skill.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...auth,
        },
        body: JSON.stringify({
          tool: skill.handler_ref ?? skill.name,
          arguments: args,
        }),
      });
      if (!res.ok) {
        throw new Error(
          `MCP ${skill.handler_ref ?? skill.name} HTTP ${res.status}`,
        );
      }
      return res.json();
    }

    default:
      throw new Error(`Unsupported handler_type: ${skill.handler_type}`);
  }
}

// ---------- 核心：把 skills 转成 AI SDK 的 tools ----------
export function buildSkillTools(skills: SkillRow[]): Record<string, any> {
  const result: Record<string, any> = {};

  for (const skill of skills) {
    // 🚨 加 skill__ 前缀，避免和内置 / MCP tool 重名
    const toolName = `skill__${skill.name}`;

    result[toolName] = tool({
      description: `[SKILL:${skill.display_name ?? skill.name}] ${skill.description}`,
      inputSchema: skill.input_schema
        ? (skill.input_schema as any)
        : z.object({}).passthrough(),
      execute: async (args: any) => {
        console.log(`[SKILL] 调用 ${skill.name}`, args);
        try {
          const out = await callSkill(skill, args);
          console.log(`[SKILL] ${skill.name} 返回:`, out);
          return out;
        } catch (err) {
          console.error(`[SKILL] ${skill.name} 失败:`, err);
          throw err;
        }
      },
    });
  }

  return result;
}