import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { setSession } from "@/lib/auth";
import {log} from "@/lib/logger"
export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username or password can't be empty" },
        { status: 400 },
      );
    }

   // 3. Query account（Convert username to lowercase to prevent case sensitivity issue）
    const normalizedUsername = String(username).trim().toLowerCase();
    const result = await pool.query(
      `SELECT id, username, password, islocker 
       FROM public.account 
       WHERE LOWER(username) = $1`,
      [normalizedUsername]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Username or password is incorrect" },
        { status: 401 }
      );
    }


    const account = result.rows[0];

    // 2. Check account is locked
    if (account.islocker === true) {
      log("Account is locked, please contact the administrator");
      return NextResponse.json(
        { error: "Account is locked, please contact the administrator" },
        { status: 403 },
      );
    }

    // 3. Verify password
    if (account.password !== password) {
      return NextResponse.json({ error: "Username or password is incorrect" }, { status: 401 });
    }

    // 4. Set session cookie
    await setSession(account.username);

    return NextResponse.json({ success: true, username: account.username });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error, please try again later" }, { status: 500 });
  }
}
