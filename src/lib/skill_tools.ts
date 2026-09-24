// src/lib/skill-tools.ts
import { jsonSchema, tool } from "ai";
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
  if (!skill.endpoint) {
    throw new Error(`Skill ${skill.name} (mcp) 缺少 endpoint`);
  }
  const auth = resolveAuth(skill);
  const toolName = skill.handler_ref ?? skill.name;

  const res = await fetch(skill.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      ...auth,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
  });

  if (!res.ok) {
    throw new Error(`MCP ${toolName} HTTP ${res.status}: ${await res.text()}`);
  }

  const text = await res.text();
  const dataLine = text.split("\n").find((line) => line.startsWith("data: "));
  if (!dataLine) {
    throw new Error(`MCP ${toolName} 响应格式错误: ${text.slice(0, 200)}`);
  }

  const json = JSON.parse(dataLine.slice(6));
  if (json.error) {
    throw new Error(`MCP ${toolName} error: ${json.error.message}`);
  }

  // 👇 提取 content 里的纯文本
  const content = json.result?.content;
  if (Array.isArray(content)) {
    const textParts = content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");

    // content[].text 本身可能是 JSON 字符串（如 {"results":[...]}），
    // 尝试解析，解析成功就返回结构化对象，失败就返回文本
    try {
      return JSON.parse(textParts);
    } catch {
      return textParts;
    }
  }

  return json.result;
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
    ? jsonSchema(skill.input_schema as any)
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