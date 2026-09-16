// src/db/schema.ts
import {
  pgTable, bigserial, varchar, text, boolean, jsonb, timestamp,
  uniqueIndex, index, check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const mcpServer = pgTable("mcp_server", {
  id:          bigserial("id", { mode: "number" }).primaryKey(),
  name:        varchar("name", { length: 64 }).notNull(),
  description: text("description"),
  apiUrl:      varchar("api_url", { length: 512 }).notNull(),
  apiKey:      varchar("api_key", { length: 512 }),
  status:      varchar("status", { length: 16 }).notNull().default("unknown"),
  lastError:   text("last_error"),
  permission:  varchar("permission", { length: 16 }).notNull().default("read"),
  enabled:     boolean("enabled").notNull().default(false),
  tools:       jsonb("tools").notNull().default([]),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t:any) => [
  uniqueIndex("uniq_mcp_server_name").on(t.name),
  index("idx_mcp_server_status").on(t.status),
  check("chk_mcp_status", sql`${t.status} IN ('unknown','connected','error','disabled')`),
  check("chk_mcp_permission", sql`${t.permission} IN ('read','write','admin')`),
]);