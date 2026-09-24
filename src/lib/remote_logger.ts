// lib/remote_logger.ts
const LOG_API = process.env.LOG_API_URL || "http://localhost:3000/api/logs";
const LOG_TOKEN = process.env.LOG_API_TOKEN;
const FLUSH_INTERVAL = 2000;
const MAX_BUFFER = 50;

// 👇 只记录这些级别（log/info 太多，忽略）
const INCLUDE_LEVELS: LogLevel[] = ["warn", "error"];

type LogLevel = "log" | "info" | "warn" | "error" | "debug";

let buffer: any[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let originalConsole: Record<string, any> = {};
let installed = false;
let isSending = false; // 👈 防止递归

function stringify(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function enqueue(level: LogLevel, args: unknown[]) {
  // 👇 级别过滤（建议取消注释）
  // if (!INCLUDE_LEVELS.includes(level)) return;

  const text = args.map(stringify).join(" ");

  const logEntry = {
    level,
    args: args.map(stringify),
    text,
    timestamp: Date.now(),
    source: process.env.APP_NAME || "iagent-web",
  };

  buffer.push(logEntry);

  // 🔍 调试：显示缓冲区状态
  if (level === "warn" || level === "error") {
    originalConsole.warn(
      `[remote-logger] enqueued ${level}: ${text.substring(0, 100)} (buffer: ${buffer.length}/${MAX_BUFFER})`,
    );
  }

  if (buffer.length >= MAX_BUFFER) {
    originalConsole.warn(
      `[remote-logger] buffer full (${MAX_BUFFER}), flushing...`,
    );
    flush().catch(() => {});
  }
}
async function flush() {
  if (buffer.length === 0) {
    originalConsole.log("[remote-logger] flush: buffer empty, skip");
    return;
  }
  if (isSending) {
    originalConsole.warn("[remote-logger] flush: already sending, skip");
    return;
  }
  isSending = true;

  const batch = buffer.splice(0, buffer.length);
  originalConsole.log(
    `[remote-logger] flushing ${batch.length} logs to ${LOG_API}`,
  );

  try {
    const response = await fetch(LOG_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(LOG_TOKEN ? { Authorization: `Bearer ${LOG_TOKEN}` } : {}),
      },
      body: JSON.stringify({ logs: batch }),
    });

    // 🔍 关键：检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      originalConsole.error(
        `[remote-logger] API error: ${response.status} ${response.statusText}`,
        errorText,
      );

      // 🔄 失败时将日志放回 buffer（可选）
      // buffer.unshift(...batch);
    } else {
      const result = await response.json();
      originalConsole.log(
        `[remote-logger] success: ${result.count} logs saved`,
      );
    }
  } catch (err) {
    originalConsole.error("[remote-logger] send failed:", err);

    // 🔄 网络错误时将日志放回 buffer（可选）
    // buffer.unshift(...batch);
  } finally {
    isSending = false;
  }
}

export function installRemoteLogger() {
  if (typeof window !== "undefined") {
    console.log("[remote-logger] skipped: running in browser");
    return;
  }
  if (installed) {
    console.log("[remote-logger] already installed");
    return;
  }
  installed = true;

  const levels: LogLevel[] = ["log", "info", "warn", "error", "debug"];

  // 1. 保存原始 console
  for (const level of levels) {
    originalConsole[level] = console[level].bind(console);
  }

  // 2. 打印配置信息
  originalConsole.log("=".repeat(50));
  originalConsole.log("[remote-logger] installing...");
  originalConsole.log(`[remote-logger] LOG_API: ${LOG_API}`);
  originalConsole.log(
    `[remote-logger] LOG_TOKEN: ${LOG_TOKEN ? "***set***" : "NOT SET"}`,
  );
  originalConsole.log(`[remote-logger] FLUSH_INTERVAL: ${FLUSH_INTERVAL}ms`);
  originalConsole.log(`[remote-logger] MAX_BUFFER: ${MAX_BUFFER}`);
  originalConsole.log(
    `[remote-logger] INCLUDE_LEVELS: ${INCLUDE_LEVELS.join(", ")}`,
  );

  // 3. 替换
  for (const level of levels) {
    console[level] = (...args: unknown[]) => {
      originalConsole[level](...args);
      enqueue(level, args);
    };
  }

  originalConsole.log("[remote-logger] ✓ installed successfully");
  originalConsole.log("=".repeat(50));

  flushTimer = setInterval(() => {
    flush().catch(() => {});
  }, FLUSH_INTERVAL);

  // 🔍 测试：立即触发一次 flush（仅用于调试）
  // setTimeout(() => {
  //   console.warn("[remote-logger] test log");
  // }, 1000);
}
