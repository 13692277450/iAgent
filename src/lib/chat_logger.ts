// lib/chat-logger.ts
import { pool } from "@/lib/db";
import { log } from "@/lib/logger";

type LogEntry = {
  sessionId: string;
  username: string | null;
  role: "user" | "assistant";
  content: string;
  parts?: any;
  llmModel?: string;
  ragUsed?: boolean;
  ragSources?: any[];
  metadata?: any;
};

type SessionEntry = {
  sessionId: string;
  username: string | null;
  llmModel?: string;
};

const logQueue: LogEntry[] = [];
const sessionQueue = new Map<string, SessionEntry>();

let flushTimer: NodeJS.Timeout | null = null;
const FLUSH_INTERVAL = 2000;
const MAX_QUEUE_SIZE = 100;

/** 入队一条消息日志 */
export function enqueueChatLog(entry: LogEntry) {
  logQueue.push(entry);
  if (logQueue.length >= MAX_QUEUE_SIZE) {
    flushLogs().catch((err) => log("[chat-logger] flush failed:", err));
  }
}

/** 注册会话（首次消息时） */
export function enqueueChatSession(entry: SessionEntry) {
  if (!sessionQueue.has(entry.sessionId)) {
    sessionQueue.set(entry.sessionId, entry);
  }
}

/** 批量刷入数据库 */
async function flushLogs() {
  if (logQueue.length === 0 && sessionQueue.size === 0) return;

  const logsToWrite = logQueue.splice(0, logQueue.length);
  const sessionsToWrite = Array.from(sessionQueue.values());
  sessionQueue.clear();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. 会话汇总
    for (const s of sessionsToWrite) {
      await client.query(
        `INSERT INTO chat_session (id, username, llm_model, message_count)
         VALUES ($1, $2, $3, 0)
         ON CONFLICT (id) DO NOTHING`,
        [s.sessionId, s.username, s.llmModel ?? null],
      );
    }

    // 2. 消息日志批量插入
    if (logsToWrite.length > 0) {
      const values: any[] = [];
      const placeholders: string[] = [];

      logsToWrite.forEach((l, i) => {
        const b = i * 9;
        placeholders.push(
          `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, $${b + 8}, $${b + 9})`,
        );
        values.push(
          l.sessionId,
          l.username,
          l.role,
          l.content,
          l.parts ? JSON.stringify(l.parts) : null,
          l.llmModel ?? null,
          l.ragUsed ?? false,
          l.ragSources ? JSON.stringify(l.ragSources) : null,
          l.metadata ? JSON.stringify(l.metadata) : null,
        );
      });

      await client.query(
        `INSERT INTO chat_log
           (session_id, username, role, content, parts, llm_model, rag_used, rag_sources, metadata)
         VALUES ${placeholders.join(",")}`,
        values,
      );

      // 3. 更新每个会话的消息数
      const sessionIds = [...new Set(logsToWrite.map((l) => l.sessionId))];
      for (const sid of sessionIds) {
        const count = logsToWrite.filter((l) => l.sessionId === sid).length;
        await client.query(
          `UPDATE chat_session SET
             message_count = message_count + $1,
             ended_at = NOW()
           WHERE id = $2`,
          [count, sid],
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    log("[chat-logger] batch insert failed:", err);
    logQueue.push(...logsToWrite);
  } finally {
    client.release();
  }
}

function startTimer() {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    flushLogs().catch((err) => log("[chat-logger] timer flush failed:", err));
  }, FLUSH_INTERVAL);
}

function setupShutdownHook() {
  const shutdown = async () => {
    if (flushTimer) clearInterval(flushTimer);
    await flushLogs().catch(() => {});
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

if (typeof window === "undefined") {
  startTimer();
  setupShutdownHook();
}
