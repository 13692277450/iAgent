// src/lib/mcp-tools.ts
import { tool } from "ai";
import { z } from "zod";

export type McpServerRow = {
  id: number;
  name: string;
  connection_type: string;
  connection_api: Record<string, any>;
  auth_type: string;
  auth_config: Record<string, any> | null;
  tools: Array<{
    name: string;
    description?: string;
    inputSchema?: any;
  }>;
};

// ---------- 认证解析 ----------
function resolveAuth(srv: McpServerRow): Record<string, string> {
  if (srv.auth_type === "none" || !srv.auth_config) return {};
  const cfg = srv.auth_config;

  switch (srv.auth_type) {
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

// ---------- 按 connection_type 分派调用 ----------
async function callMcpServer(
  srv: McpServerRow,
  toolName: string,
  args: unknown,
): Promise<unknown> {
  switch (srv.connection_type) {
    case "http":
    case "sse":
    case "ws": {
      const { url, headers = {} } = srv.connection_api;
      const auth = resolveAuth(srv);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers, ...auth },
        body: JSON.stringify({ tool: toolName, arguments: args }),
      });
      if (!res.ok) {
        throw new Error(`MCP ${srv.name} HTTP ${res.status}: ${await res.text()}`);
      }
      return res.json();
    }

    case "stdio": {
      const { command, args: cmdArgs = [], env = {}, cwd } = srv.connection_api;
      const { spawn } = await import("node:child_process");
      const child = spawn(command, cmdArgs, {
        cwd,
        env: { ...process.env, ...env },
        stdio: ["pipe", "pipe", "pipe"],
      });

      return await new Promise((resolve, reject) => {
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (d) => (stdout += d.toString()));
        child.stderr.on("data", (d) => (stderr += d.toString()));

        const request = {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: toolName, arguments: args },
        };
        child.stdin.write(JSON.stringify(request) + "\n");
        child.stdin.end();

        child.on("close", (code) => {
          if (code !== 0) {
            reject(new Error(`MCP ${srv.name} exited ${code}: ${stderr}`));
            return;
          }
          try {
            const lastLine = stdout.trim().split("\n").pop() ?? "{}";
            const parsed = JSON.parse(lastLine);
            resolve(parsed.result ?? parsed);
          } catch {
            resolve(stdout);
          }
        });
        child.on("error", reject);
      });
    }

    case "tcp":
    case "grpc": {
      const { host, port, tls } = srv.connection_api;
      const net = await import("node:net");
      const socket = tls
        ? (await import("node:tls")).connect({ host, port })
        : net.connect({ host, port });

      return await new Promise((resolve, reject) => {
        let data = "";
        socket.on("connect", () => {
          socket.write(JSON.stringify({ tool: toolName, arguments: args }));
          socket.end();
        });
        socket.on("data", (d) => (data += d.toString()));
        socket.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
        socket.on("error", reject);
        socket.setTimeout(10000, () => {
          socket.destroy();
          reject(new Error("MCP TCP timeout"));
        });
      });
    }

    default:
      throw new Error(`Unsupported connection type: ${srv.connection_type}`);
  }
}

// ---------- 核心：把 MCP servers 转成 AI SDK 的 tools ----------
export function buildMcpTools(servers: McpServerRow[]): Record<string, any> {
  const result: Record<string, any> = {};

  for (const srv of servers) {
    for (const t of srv.tools ?? []) {
      // 🚨 加 server 前缀，避免不同 server 的 tool 重名
      const toolName = `${srv.name}__${t.name}`;

      result[toolName] = tool({
        description: `[MCP:${srv.name}] ${t.description ?? t.name}`,
        inputSchema: t.inputSchema
          ? (t.inputSchema as any)
          : z.object({}).passthrough(),
        execute: async (args: any) => {
          console.log(`[MCP] 调用 ${srv.name}.${t.name}`, args);
          try {
            return await callMcpServer(srv, t.name, args);
          } catch (err) {
            console.error(`[MCP] ${srv.name}.${t.name} 失败:`, err);
            throw err;
          }
        },
      });
    }
  }

  return result;
}