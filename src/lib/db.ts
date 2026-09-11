import { Pool } from "pg";

// 🚨 用全局变量缓存，避免 Next.js 热重载时重复创建连接池
const globalForPg = global as unknown as { pgPool: Pool | undefined };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}