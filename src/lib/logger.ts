// src/lib/logger.ts
export type LogLevel = "log" | "info" | "warn" | "error" | "debug";

export type LogEntry = {
  id: number;
  level: LogLevel;
  text: string;
  time: string;
  ts: number;
};

type Listener = (entry: LogEntry) => void;

let seq = 0;
const listeners = new Set<Listener>();

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

// 核心：发一条日志
function emit(level: LogLevel, args: unknown[]) {
  const text = args.map(stringify).join(" ");

  // 1. 照常打印到浏览器控制台
  const native = console[level] ?? console.log;
  native.apply(console, args as any);

  // 2. 推给所有订阅者
  const entry: LogEntry = {
    id: ++seq,
    level,
    text,
    time: nowTime(),
    ts: Date.now(),
  };
listeners.forEach((fn) => {
  fn(entry);
});}

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