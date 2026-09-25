"use client";

import Chat from "./chatpage";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TokenCalendarDialog } from "./dialogTokenUsageUI";
import { LogCard } from "./pageLogs";
import { McpSelectedCard } from "./pageMCPServers";
import { SkillsSelectedCard } from "@/components/assistant-ui/elements/skills-selected-card";
import { ConversationHistory } from "@/components/conversation-history";
import { useConversation } from "@/components/conversation-provider";
import RagSection from "@/components/rag_section";
import { useTheme } from "next-themes";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useI18n } from "@/components/i18n-provider";
import { ChartPie, LogOut, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { SystemSettingsCard } from "@/components/SystemSettingsCard";
import { SupportChatBubble } from "@/components/SupportChatBubble";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { triggerRefresh, restoreId, clearRestore } = useConversation();
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false); // 👈 保留

  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      {/* 1. 顶部横条 */}
      <div className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
        {mounted ? (
          theme === "dark" ? (
            <Image
              src="/iAgentLogo-dark.png"
              loading="eager"
              alt="iAgent"
              width={100}
              height={24}
              className="h-9 w-auto"
            />
          ) : (
            <Image
              src="/iAgentLogo-light.png"
              loading="eager"
              alt="iAgent"
              width={100}
              height={24}
              className="h-9 w-auto"
            />
          )
        ) : (
          // 👈 服务端和客户端首次渲染都渲染这个占位
          <div className="h-9 w-[100px]" />
        )}
        {/* 全局状态指示 */}
        <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 md:flex">
          <span className="relative flex size-2 text-emerald-500">
            <span className="status-dot relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("app.runtime")}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher />

          {/* 👇 主题按钮：mounted 之前渲染固定占位符 */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted"
            aria-label="Toggle theme"
            suppressHydrationWarning
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="size-4 text-cyan-600 dark:text-cyan-400" />
              ) : (
                <Moon className="size-4 text-cyan-600 dark:text-cyan-400" />
              )
            ) : (
              // 👇 服务端和客户端首次渲染都渲染这个空占位
              <div className="size-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="size-3.5" />
            {t("common.logout")}
          </button>
        </div>
      </div>

      {/* 2. 下方三个竖条区域 */}
      <div className="flex min-h-0 flex-1 w-full">
        {/* 左侧竖条 */}
        <div className="w-[240px] min-w-0 space-y-3 overflow-y-auto border-r border-border bg-muted/30 p-3 custom-scrollbar lg:w-[22%]">
          <ConversationHistory />
          <SkillsSelectedCard />
          <McpSelectedCard />
          <RagSection />
          <SystemSettingsCard />
        </div>

        {/* 中间竖条 - 核心内容区 */}
        <div className="min-w-0 flex-1 bg-background p-2 pb-[2px]">
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-muted/50 p-2">
              <Chat />
            </div>
          </div>
        </div>

        {/* 右侧竖条 */}
        <div className="w-[240px] min-w-0 space-y-3 overflow-y-auto border-l border-border bg-muted/30 p-3 custom-scrollbar lg:w-[22%]">
          <Button
            type="button"
            className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-[0_4px_16px_-6px_rgba(34,211,238,0.6)] transition-all hover:from-cyan-500 hover:to-indigo-500 hover:shadow-[0_6px_20px_-6px_rgba(34,211,238,0.7)]"
            onClick={() => setOpen(true)}
          >
            <ChartPie className="size-4" />
            {t("token.view")}
          </Button>
          <TokenCalendarDialog open={open} onOpenChange={setOpen} />

          <LogCard />

          <SupportChatBubble />
        </div>
      </div>
    </div>
  );
}
