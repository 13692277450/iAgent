/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
"use client";
import Chat from "./chatpage";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TokenCalendarDialog } from "./dialogTokenUsageUI";
import { LogCard } from "./pageLogs";
import { McpProvider } from "@/components/mcp_provider";
import { McpSelectedCard } from "./pageMCPServers";
import { SkillsProvider } from "@/components/skills-provider";
import { SkillsDialog } from "@/components/skills-dialog";
import { SkillsSelectedCard } from "@/components/skills-selected-card";
import { ConversationHistory } from "@/components/conversation-history";
import { ConversationProvider } from "@/components/conversation-provider";
import { useConversation } from "@/components/conversation-provider";
import RagCard from "@/components/rag_card";
import RagSection from "@/components/rag_section";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { triggerRefresh, restoreId, clearRestore } = useConversation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
      <div className="w-full h-[5%] bg-card text-cyan-500 dark:text-cyan-300 flex items-center px-6 border-b border-border">
        <h1 className="text-xl font-bold">🦚 iAgent</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )
            ) : (
              <div className="w-4 h-4" /> // 占位，避免布局跳动
            )}
          </button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleLogout}
            className="h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-red-400"
          >
            LOGOUT
          </Button>
        </div>
      </div>

      {/* 2. 下方三个竖条区域 */}
      <div className="flex flex-1 min-h-0 w-full">
        {/* 左侧竖条 */}
        <div className="w-[22%] min-w-0 overflow-y-auto bg-muted/30 border-r border-border p-4 space-y-2">
          <ConversationHistory />
          <SkillsSelectedCard />
          <McpSelectedCard />
          <RagSection />

          <Card className="bg-card shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-blue-600 dark:text-blue-400">
                SYSTEM CENTER
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              SYSTEM INFORMATION
              <div className="mt-4 space-y-2">
                {["Local APIKEY SETUP", "Item 2", "Item 3"].map((item) => (
                  <div
                    key={item}
                    className="p-2 bg-muted rounded-md cursor-pointer hover:bg-muted/70 transition-colors"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 中间竖条 - 核心内容区 */}
        <div className="w-[56%] min-w-0 bg-background p-2 pb-[2px]">
          <div className="h-full flex flex-col min-h-0">
            <div className="flex-1 min-h-0 bg-muted/50 rounded-xl border border-border p-2 overflow-hidden">
              <Chat />
            </div>
          </div>
        </div>

        {/* 右侧竖条 */}
        <div className="w-[22%] min-w-0 overflow-y-auto bg-muted/30 border-l border-border p-4 space-y-2">
          <Card className="bg-card">
            <Button
              className="w-full text-cyan-600 dark:text-cyan-200 hover:bg-cyan-500/10 hover:border-cyan-300/60 transition-all mb-3"
              onClick={() => setOpen(true)}
            >
              🍁🍁🍁 TOKEN USAGE VIEW
            </Button>
            <TokenCalendarDialog open={open} onOpenChange={setOpen} />
          </Card>
          <div>
            <div className="h-px mx-4 bg-cyan-400/20 shrink-0 mb-3" />
            <LogCard />
          </div>
          <div className="h-px mx-4 bg-cyan-400/20 shrink-0 mb-3" />
        </div>
      </div>
    </div>
  );
}
