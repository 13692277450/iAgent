import { pool } from "./db";

export type TokenDailyRecord = {
  update_date: string; // YYYY-MM-DD
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

/** 按用户名查询每日 token 使用量（按日期聚合求和） */
export async function getTokenUsageByUser(
  username: string,
): Promise<TokenDailyRecord[]> {
  const result = await pool.query<TokenDailyRecord>(
    `SELECT update_date::text AS update_date, SUM(prompt_tokens) AS prompt_tokens, SUM(completion_tokens) AS completion_tokens, SUM(total_tokens) AS total_tokens
     FROM public.token
     WHERE username = $1
     GROUP BY update_date
     ORDER BY update_date ASC`,
    [username],
  );
  return result.rows.map((row) => ({
    update_date: row.update_date,
    prompt_tokens: Number(row.prompt_tokens),
    completion_tokens: Number(row.completion_tokens),
    total_tokens: Number(row.total_tokens),
  }));
}