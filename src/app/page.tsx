"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ArrowUpRight, Bot, Moon, Ship, Sun } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function Home() {
  const { theme, setTheme, mounted: themeMounted } = useThemeSafe();
  const { t } = useI18n();

  return (
    <div className="tech-bg flex min-h-screen flex-col items-center justify-center overflow-hidden font-sans">
      {/* 主题 / 语言切换器 */}
      <div className="absolute right-5 top-5 z-20 flex items-center gap-2">
        <LocaleSwitcher />
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? t("theme.light") : t("theme.dark")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          {themeMounted && theme === "dark" ? (
            <Sun className="size-4 text-cyan-600 dark:text-cyan-400" />
          ) : (
            <Moon className="size-4 text-cyan-600 dark:text-cyan-400" />
          )}
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Logo */}
        <div className="relative mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 shadow-[0_8px_40px_-8px_rgba(34,211,238,0.6)]">
            <span className="text-4xl drop-shadow" aria-hidden>
              🦚
            </span>
          </div>
          <div className="absolute -inset-3 -z-10 rounded-3xl bg-cyan-500/20 blur-2xl" />
        </div>

        <h1 className="brand-text text-4xl font-black uppercase tracking-[0.15em] sm:text-5xl">
          {t("app.portal")}
        </h1>
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.35em] text-muted-foreground">
          {t("app.destination")}
        </p>

        {/* 卡片区 */}
        <div className="mt-14 grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          {/* GoK8s */}
          <Link
            href="/indexgok8s.html"
            className="glow-card group relative flex flex-col items-start gap-4 rounded-2xl p-8 text-left"
          >
            <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground opacity-60 transition-all group-hover:-translate-y-0.5 group-hover:opacity-100">
              <ArrowUpRight className="size-4" />
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-2xl shadow-inner">
              ☸️
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                {t("app.goK8s")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("app.goK8sDesc")}
              </p>
            </div>
          </Link>

          {/* iAgent */}
          <Link
            href="/login"
            className="glow-card group relative flex flex-col items-start gap-4 rounded-2xl p-8 text-left"
          >
            <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground opacity-60 transition-all group-hover:-translate-y-0.5 group-hover:opacity-100">
              <ArrowUpRight className="size-4" />
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-2xl shadow-[0_4px_20px_-4px_rgba(34,211,238,0.7)]">
              <Bot className="size-6 text-white" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                iAgent
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("app.iagentDesc")}
              </p>
            </div>
          </Link>
        </div>

        <p className="mt-12 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground/70">
          <Ship className="size-3.5" />
          iAgent Intelligence Platform
        </p>
      </div>
    </div>
  );
}

/** next-themes mounted-safe hook */
function useThemeSafe() {
  const themeApi = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return {
    theme: themeApi.resolvedTheme ?? themeApi.theme ?? "dark",
    setTheme: themeApi.setTheme,
    mounted,
  };
}