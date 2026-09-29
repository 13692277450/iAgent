// import { Pool } from "pg";

// // 🚨 用全局变量缓存，避免 Next.js 热重载时重复创建连接池
// const globalForPg = global as unknown as { pgPool: Pool | undefined };

// export const pool =
//   globalForPg.pgPool ??
//   new Pool({
//     connectionString: process.env.DATABASE_URL,
//   });

// if (process.env.NODE_ENV !== "production") {
//   globalForPg.pgPool = pool;
// }

import { Pool } from "pg";

// 🚨 用全局变量缓存，避免 Next.js 热重载时重复创建连接池
const globalForPg = global as unknown as { pgPool: Pool | undefined };

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL 未设置");
}

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

// ============================================================================
// 时间工具
// ============================================================================

/** 当前时间（ISO-8601 UTC 字符串） */
export function nowIso(): string {
  return new Date().toISOString();
}

/** 今天（YYYY-MM-DD） */
export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ISO 字符串 → Date */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** ISO 字符串 → 本地化展示 */
export function formatTimestamp(value: unknown, locale = "zh-CN"): string {
  const date = toDate(value);
  return date ? date.toLocaleString(locale) : "";
}

// ============================================================================
// 通用查询助手
// ============================================================================

/** 查询多行 */
export async function query<T = any>(
  sql: string,
  params: any[] = [],
): Promise<T[]> {
  const { rows } = await pool.query(sql, params);
  return rows as T[];
}

/** 查询单行 */
export async function queryOne<T = any>(
  sql: string,
  params: any[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** 执行写操作，返回受影响行数 */
export async function execute(
  sql: string,
  params: any[] = [],
): Promise<number> {
  const result = await pool.query(sql, params);
  return result.rowCount ?? 0;
}

// ============================================================================
// 类型定义
// ============================================================================

export type AccountRow = {
  id: number;
  username: string;
  password: string;
  department: string | null;
  islocker: boolean;
  isAdmin: boolean;
};

export type DepartmentRow = {
  id: number;
  code: string;
  name: string;
  short_name: string | null;
  parent_id: number | null;
  manager: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LlmRow = {
  id: number;
  llm_name: string | null;
  llm_apikey: string | null;
  llm_baseurl: string | null;
  llm_model: string | null;
  username: string | null;
  is_default: boolean;
};

export type AboutRow = {
  id: number;
  version: string;
  build_time: string;
  commit_hash: string | null;
  commit_message: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================================================
// Repository 基类
// ============================================================================

export class Repository<T> {
  readonly tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async all(): Promise<T[]> {
    return query<T>(`SELECT * FROM "${this.tableName}"`);
  }

  async getById(id: string | number): Promise<T | null> {
    return queryOne<T>(`SELECT * FROM "${this.tableName}" WHERE id = $1`, [id]);
  }

  async find(where: Record<string, any>): Promise<T[]> {
    const keys = Object.keys(where);
    if (keys.length === 0) return this.all();
    const conditions = keys.map((k, i) => `"${k}" = $${i + 1}`).join(" AND ");
    return query<T>(
      `SELECT * FROM "${this.tableName}" WHERE ${conditions}`,
      keys.map((k) => where[k]),
    );
  }

  async findOne(where: Record<string, any>): Promise<T | null> {
    const rows = await this.find(where);
    return rows[0] ?? null;
  }

  async insert(data: Record<string, any>): Promise<T> {
    const keys = Object.keys(data);
    const values = keys.map((k) => data[k]);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const columns = keys.map((k) => `"${k}"`).join(", ");
    const row = await queryOne<T>(
      `INSERT INTO "${this.tableName}" (${columns}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return row!;
  }

  async update(
    id: string | number,
    patch: Record<string, any>,
  ): Promise<T | null> {
    const keys = Object.keys(patch);
    if (keys.length === 0) return this.getById(id);
    const sets = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
    const values = keys.map((k) => patch[k]);
    return queryOne<T>(
      `UPDATE "${this.tableName}" SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id],
    );
  }

  async remove(id: string | number): Promise<boolean> {
    const count = await execute(
      `DELETE FROM "${this.tableName}" WHERE id = $1`,
      [id],
    );
    return count > 0;
  }

  async count(where: Record<string, any> = {}): Promise<number> {
    const keys = Object.keys(where);
    const conditions =
      keys.length > 0
        ? " WHERE " + keys.map((k, i) => `"${k}" = $${i + 1}`).join(" AND ")
        : "";
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${this.tableName}"${conditions}`,
      keys.map((k) => where[k]),
    );
    return Number(row?.count ?? 0);
  }
}

// ============================================================================
// 各业务仓储
// ============================================================================

class AccountRepository extends Repository<AccountRow> {
  constructor() {
    super("account");
  }

  findByUsername(username: string): Promise<AccountRow | null> {
    return queryOne<AccountRow>(
      `SELECT * FROM "account" WHERE LOWER(username) = LOWER($1)`,
      [username],
    );
  }
}

class DepartmentRepository extends Repository<DepartmentRow> {
  constructor() {
    super("departments");
  }

  findByCode(code: string): Promise<DepartmentRow | null> {
    return queryOne<DepartmentRow>(
      `SELECT * FROM "departments" WHERE UPPER(code) = UPPER($1)`,
      [code],
    );
  }

  listActive(): Promise<DepartmentRow[]> {
    return query<DepartmentRow>(
      `SELECT * FROM "departments" WHERE is_active = TRUE ORDER BY code`,
    );
  }
}

class LlmRepository extends Repository<LlmRow> {
  constructor() {
    super("llm");
  }

  listDesc(): Promise<LlmRow[]> {
    return query<LlmRow>(`SELECT * FROM "llm" ORDER BY id DESC`);
  }

  findDefault(): Promise<LlmRow | null> {
    return queryOne<LlmRow>(
      `SELECT * FROM "llm" WHERE is_default = TRUE LIMIT 1`,
    );
  }

  async clearOtherDefaults(excludeId: string | number): Promise<void> {
    await execute(
      `UPDATE "llm" SET is_default = FALSE WHERE id != $1 AND is_default = TRUE`,
      [excludeId],
    );
  }
}

class AboutRepository extends Repository<AboutRow> {
  constructor() {
    super("about");
  }

  getSingleton(): Promise<AboutRow | null> {
    return queryOne<AboutRow>(`SELECT * FROM "about" ORDER BY id DESC LIMIT 1`);
  }
}

// ============================================================================
// 导出
// ============================================================================

export const accountsRepo = new AccountRepository();
export const departmentsRepo = new DepartmentRepository();
export const llmsRepo = new LlmRepository();
export const aboutRepo = new AboutRepository();

/** 所有仓储的统一出口 */
export const db = {
  accounts: accountsRepo,
  departments: departmentsRepo,
  llms: llmsRepo,
  about: aboutRepo,

  // 原始查询助手
  query,
  queryOne,
  execute,
  pool,
} as const;

export default db;
