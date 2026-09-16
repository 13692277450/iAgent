"use client";
import Chat from "./chatpage";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TokenCalendarDialog } from "./dialogTokenUsageUI";
import { LogCard } from "./pageLogs";
import { McpServerDialog } from "./pageMCPServersDialog";
import { McpProvider } from "@/components/mcp_provider";
import { McpSelectedCard } from "./pageMCPServers";
import { SkillsProvider } from "@/components/skills-provider";
import { SkillsDialog } from "@/components/skills-dialog";
import { SkillsSelectedCard } from "@/components/skills-selected-card";

export default function Layout() {
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* 1. 顶部横条 */}
      <div className="w-full h-[5%] bg-slate-900 text-cyan-300 flex items-center px-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">🦚 iAgent</h1>
        <div className="ml-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={handleLogout}
            className="h-8 px-3 rounded-lg text-xs text-slate-400 hover:text-red-400"
          >
            LOGOUT
          </Button>
        </div>
      </div>

      {/* 2. 下方三个竖条区域 */}
      <div className="flex flex-1 min-h-0 w-full ">
        {/* 左侧竖条 */}
        <div className="w-[22%] min-w-0 overflow-y-auto bg-slate-50 border-r border-slate-200 p-4 space-y-2">
          <Card className="bg-white shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-blue-600">
                CONVERSATION CENTER
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Conversation History
              <div className="mt-4 space-y-2">
                {["Item 1", "Item 2", "Item 3"].map((item) => (
                  <div
                    key={item}
                    className="p-2 bg-slate-100 rounded-md cursor-pointer hover:bg-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <SkillsSelectedCard />

          <McpSelectedCard />

          <Card className="bg-white shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-blue-600">
                VECTOR DATA CENTER
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              VECTOR DATA INFORMATION
              <div className="mt-4 space-y-2">
                {["VECTOR DATA STATUS", "VECTOR DATA UPLOAD", "Item 3"].map(
                  (item) => (
                    <div
                      key={item}
                      className="p-2 bg-slate-100 rounded-md cursor-pointer hover:bg-slate-200"
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-blue-600">
                SYSTEM CENTER
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              SYSTEM INFORMATION
              <div className="mt-4 space-y-2">
                {["Local APIKEY SETUP", "Item 2", "Item 3"].map((item) => (
                  <div
                    key={item}
                    className="p-2 bg-slate-100 rounded-md cursor-pointer hover:bg-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 中间竖条 - 核心内容区 */}
        <div className="w-[56%] min-w-0 bg-white p-2 pb-[2px]">
          <div className="h-full flex flex-col min-h-0">
            <div className="flex-1 min-h-0 bg-slate-100 rounded-xl border border-slate-700 p-2 overflow-hidden">
              <Chat />
            </div>
          </div>
        </div>

        {/* 右侧竖条 */}
        <div className="w-[22%] min-w-0 overflow-y-auto bg-slate-50 border-l border-slate-200 p-4 space-y-2">
          <Card className="bg-slate-950">
            <Button
              className="w-full inset-shadow-card-foreground text-cyan-200 hover:bg-cyan-500/10 hover:border-cyan-300/60 transition-all mb-3"
              onClick={() => setOpen(true)}
            >
              🍁🍁🍁 TOKEN USAGE VIEW
            </Button>
            <TokenCalendarDialog open={open} onOpenChange={setOpen} />
          </Card>
          <div>
            <div className="h-px mx-4 bg-cyan-400/20 shrink-0 mb-3" />
            {/* <p /> 📊 Running Logs <p /> */}
            <LogCard />
          </div>
          <div className="h-px mx-4 bg-cyan-400/20 shrink-0 mb-3" />

          {/* <Card className="bg-white shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-lg">LOGS PANEL</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              <div className="mt-4 p-3 bg-blue-50 rounded-md text-blue-700 height-[300px] overflow-y-auto">
                📊 Running Logs
                <LogCard />
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
}
