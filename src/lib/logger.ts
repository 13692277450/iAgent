// src/lib/logger.ts
// 前后端共享的日志工具
// - 浏览器端：使用原生 console，保留对象可交互能力，同时支持订阅推送
// - 服务端：带颜色 / 时间戳 / 级别标签输出，并可通过环境变量 LOG_FILE 持久化到文件

export type LogLevel = "log" | "info" | "warn" | "error" | "debug";

export type LogEntry = {
  id: number;
  level: LogLevel;
  text: string;
  time: string;
  ts: number;
  color?: string;      // 👈 新增
};

type Listener = (entry: LogEntry) => void;

let seq = 0;
const listeners = new Set<Listener>();

// ==================== 环境检测 ====================
const isBrowser = typeof window !== "undefined";

// ANSI 颜色码（仅服务端终端使用，浏览器忽略）
const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
} as const;

const LEVEL_COLOR: Record<LogLevel, string> = {
  log: COLORS.white,
  info: COLORS.cyan,
  warn: COLORS.yellow,
  error: COLORS.red,
  debug: COLORS.magenta,
};

function stringify(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function nowTime(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

// ==================== 服务端可选：文件日志 ====================
// 通过 process.env.LOG_FILE 开启，默认关闭，不影响现有行为
let fileStream: any = null;
let fileStreamTried = false;

function getFileStream() {
  if (isBrowser || fileStreamTried) return fileStream;
  fileStreamTried = true;
  const logFile = (process as any)?.env?.LOG_FILE;
  if (!logFile) return null;
  try {
    const g = globalThis as any;
    const fs = g.require ? g.require("fs") : null;
    const path = g.require ? g.require("path") : null;
    if (!fs || !path) return null;
    const dir = path.dirname(logFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fileStream = fs.createWriteStream(logFile, { flags: "a" });
    return fileStream;
  } catch {
    return null;
  }
}

// ==================== 核心：发一条日志 ====================
function emit(level: LogLevel, args: unknown[]) {
  const text = args.map(stringify).join(" ");

  // 1. 输出到控制台
  if (isBrowser) {
    // 浏览器：原生 console，保留对象可交互 / 折叠能力
    const native = console[level] ?? console.log;
    native.apply(console, args as any);
  } else {
    // 服务端：带颜色、时间戳、级别标签
    const time = nowTime();
    const color = LEVEL_COLOR[level];
    const label = level.toUpperCase().padEnd(5);
    const prefix = `${COLORS.gray}[${time}]${COLORS.reset} ${color}[${label}]${COLORS.reset}`;
    const native = console[level] ?? console.log;
    native(prefix, ...args);
  }

  // 2. 服务端可选：写入文件
  if (!isBrowser) {
    const stream = getFileStream();
    if (stream) {
      const line = `[${nowTime()}] [${level.toUpperCase().padEnd(5)}] ${text}\n`;
      try {
        stream.write(line);
      } catch {
        // 写文件失败不影响主流程
      }
    }
  }

  // 3. 推给所有订阅者（前后端均可订阅）
  const entry: LogEntry = {
    id: ++seq,
    level,
    text,
    time: nowTime(),
    ts: Date.now(),
  };
  listeners.forEach((fn) => void fn(entry));
}

// 订阅 / 取消订阅
export function subscribeLogs(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// 对外的 API，像 print 一样用
export const log = (...args: unknown[]) => emit("log", args);
export const info = (...args: unknown[]) => emit("info", args);
export const warn = (...args: unknown[]) => emit("warn", args);
export const error = (...args: unknown[]) => emit("error", args);
export const debug = (...args: unknown[]) => emit("debug", args);

// 默认导出，方便 `import logger from "@/lib/logger"; logger.log(...)`
export default { log, info, warn, error, debug };

export function colorConsoleLog(message: string, style?: string) {
  if (style) {
    console.log(`%c${message}`, style);
  } else {
    console.log(message);
  }
}

export function styledLog(message: string, style: string, level: LogLevel = "log") {
  if (isBrowser) {
    // 浏览器端：用 %c 着色
    const native = console[level] ?? console.log;
    native(`%c${message}`, style);
  } else {
    // 服务端：走原有 emit，带时间戳和级别标签
    emit(level, [message]);
  }

  // 推给订阅者
  const entry: LogEntry = {
    id: ++seq,
    level,
    text: message,
    time: nowTime(),
    ts: Date.now(),
  };
  listeners.forEach((fn) => void fn(entry));
}

// lib/logger.ts
export function logWithColor(level: LogLevel, text: string, color?: string) {
  const entry: LogEntry = {
    id: ++seq,
    level,
    text,
    color,               // 👈 带颜色
    time: nowTime(),
    ts: Date.now(),
  };
  listeners.forEach((fn) => void fn(entry));
}