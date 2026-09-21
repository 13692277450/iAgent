// lib/auth.ts
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "iagent_session";

type SessionData = {
  username: string;
  department?: string;   // 例如 "HR"
  
};

export async function setSession(data: SessionData) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    // 兼容旧格式（纯 username 字符串）
    return { username: raw };
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// 👇 现在这个能正常工作了
export async function getSessionDepartment(
  _req?: NextRequest
): Promise<string | undefined> {
  const session = await getSession();
  return session?.department;
}

export async function getCurrentUsername(): Promise<string | null> {
  const session = await getSession();
  return session?.username ?? null;
}