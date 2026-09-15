// // src/app/api/mcp/route.ts
// import { NextResponse } from "next/server";
// import { pool } from "@/lib/db";

// export async function GET() {
//   try {
//     const { rows } = await pool.query(
//       `SELECT id, name, description, connection_type, status, enabled, tools
//        FROM public.mcp_server
//        ORDER BY name ASC`,
//     );
//     return NextResponse.json({ servers: rows });
//   } catch (err) {
//     console.error("Failed to fetch mcp servers:", err);
//     return NextResponse.json({ servers: [] }, { status: 500 });
//   }
// }

import { tool } from "ai";
import { z } from "zod";

// src/app/api/mcp/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {          // 👈 必须有 GET
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, connection_type, connection_api,
              auth_type, auth_config, status, enabled, tools
       FROM public.mcp_server
       ORDER BY name ASC`,
    );
    return NextResponse.json({ servers: rows });
  } catch (err) {
    console.error("Failed to fetch mcp servers:", err);
    return NextResponse.json({ servers: [] }, { status: 500 });
  }
}

type McpServerRow = {
  id: number;
  name: string;
  connection_type: string;
  connection_api: Record<string, unknown>;
  auth_type: string;
  auth_config: Record<string, unknown> | null;
  tools: Array<{ name: string; description?: string; inputSchema?: unknown }>;
};

// 把 MCP 的 tools 展开成 AI SDK 的 tool
function buildMcpTools(servers: McpServerRow[]) {
  const result: Record<string, any> = {};

  for (const srv of servers) {
    for (const t of srv.tools ?? []) {
      // 🚨 加 server 前缀，避免不同 server 的 tool 重名
      const toolName = `${srv.name}__${t.name}`;

      result[toolName] = tool({
        description: `[MCP:${srv.name}] ${t.description ?? t.name}`,
        // 如果 MCP 提供了 inputSchema，用它；否则用宽松的 any
        inputSchema: t.inputSchema
          ? (t.inputSchema as any)
          : z.object({}).passthrough(),

        execute: async (args: any) => {
          // 按 connection_type 分派
          return await callMcpServer(srv, t.name, args);
        },
      });
    }
  }

  return result;
}


async function callMcpServer(
  srv: McpServerRow,
  toolName: string,
  args: unknown,
): Promise<unknown> {
  switch (srv.connection_type) {
    // ---------- HTTP / SSE / WS ----------
    case "http":
    case "sse":
    case "ws": {
      const { url, headers = {} } = srv.connection_api as {
        url: string;
        headers?: Record<string, string>;
      };
      const auth = resolveAuth(srv);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
          ...auth,
        },
        body: JSON.stringify({ tool: toolName, arguments: args }),
      });

      if (!res.ok) {
        throw new Error(`MCP ${srv.name} HTTP ${res.status}: ${await res.text()}`);
      }
      return res.json();
    }

    // ---------- stdio（本地进程）----------
    case "stdio": {
      const { command, args: cmdArgs = [], env = {}, cwd } = srv.connection_api as {
        command: string;
        args?: string[];
        env?: Record<string, string>;
        cwd?: string;
      };

      // 每次调用起一个进程（简单但慢），生产建议常驻连接
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

        // MCP 的 stdio 协议：JSON-RPC over stdin/stdout
        // 简化版：发一条 JSON，读响应
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
            // 取最后一行 JSON-RPC 响应
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

    // ---------- TCP / gRPC ----------
    case "tcp":
    case "grpc": {
      const { host, port, tls } = srv.connection_api as {
        host: string;
        port: number;
        tls?: boolean;
      };
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

    // ---------- FTP / SFTP ----------
    case "ftp":
    case "sftp": {
      // FTP 通常不是 MCP 的标准传输方式
      // 如果你的 server 用 FTP 提供文件类 tool，按需实现
      throw new Error(`FTP/SFTP MCP not implemented: ${srv.name}`);
    }

    default:
      throw new Error(`Unsupported connection type: ${srv.connection_type}`);
  }
}


function resolveAuth(srv: McpServerRow): Record<string, string> {
  if (srv.auth_type === "none" || !srv.auth_config) return {};

  const cfg = srv.auth_config as Record<string, string>;

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
      const b64 = Buffer.from(`${user}:${pass}`).toString("base64");
      return { Authorization: `Basic ${b64}` };
    }
    default:
      return {};
  }
}