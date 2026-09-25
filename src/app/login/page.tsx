"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Moon,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function LoginPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { t } = useI18n();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isDark = mounted && resolvedTheme === "dark";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, department }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("login.invalid"));
        return;
      }

      // 登录成功，跳转到 chat
      router.push("/chat");
    } catch (err) {
      console.error(err);
      setError(t("login.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tech-bg relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* 光晕装饰 */}
      <div
        className={`pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full blur-[120px] transition-colors ${
          isDark ? "bg-cyan-600/20" : "bg-cyan-400/25"
        }`}
      />
      <div
        className={`pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full blur-[120px] transition-colors ${
          isDark ? "bg-indigo-600/15" : "bg-indigo-400/25"
        }`}
      />

      {/* 主题 / 语言切换器 */}
      <div className="absolute right-5 top-5 z-20 flex items-center gap-2">
        <LocaleSwitcher />
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? t("theme.light") : t("theme.dark")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          {mounted && isDark ? (
            <Sun className="size-4 text-cyan-600 dark:text-cyan-400" />
          ) : (
            <Moon className="size-4 text-cyan-600 dark:text-cyan-400" />
          )}
        </button>
      </div>

      <div className="glass-panel relative z-10 w-full max-w-[420px] rounded-2xl p-8 shadow-[0_20px_60px_-20px_rgba(2,6,23,0.35)]">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-[0_4px_16px_-4px_rgba(34,211,238,0.7)]">
              <ShieldCheck className="size-5" />
            </div>
            <span className="brand-text text-2xl font-bold tracking-tight">
              iAgent
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* 用户名 */}
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-cyan-600 dark:text-cyan-400" />
            <Input
              type="text"
              placeholder={t("login.username")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="h-12 rounded-xl border-border bg-card pl-11 text-foreground placeholder:text-muted-foreground focus-visible:ring-cyan-500"
            />
          </div>

          {/* 密码 */}
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-cyan-600 dark:text-cyan-400" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("login.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-xl border-border bg-card pl-11 pr-11 text-foreground placeholder:text-muted-foreground focus-visible:ring-cyan-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-cyan-500"
              aria-label={showPassword ? "Hide" : "Show"}
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
{/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              <span className="size-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          {/* 登录按钮 */}
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-base font-semibold text-white shadow-[0_4px_20px_-4px_rgba(34,211,238,0.5)] transition-all hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("login.submitting")}
              </>
            ) : (
              t("login.submit")
            )}
          </Button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t("login.or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-xl border-border bg-card text-foreground hover:bg-muted"
          >
            {t("login.github")}
          </Button>
        </form>
      </div>
    </div>
  );
}