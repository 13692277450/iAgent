"use client";
import Chat from "./chatpage";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import { TokenCalendarDialog } from "./dialogTokenUsageUI";

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
            登出
          </Button>
        </div>
      </div>

      {/* 2. 下方三个竖条区域 */}
      <div className="flex flex-1 min-h-0 w-full ">
        {/* 左侧竖条 */}
        <div className="w-[27%] min-w-0 overflow-y-auto bg-slate-50 border-r border-slate-200 p-4 space-y-2">
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
          <Card className="bg-white shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-blue-600">
                SKILLS CENTER
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              SKILLS LIST
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
          <Card className="bg-white shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-blue-600">
                SCP SERVER
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500 text-green-600">
              ONLINE SERVERS
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
            <CardContent className="text-sm text-slate-500 text-red-600">
              OFFLINE SERVERS
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
        <div className="w-[46%] min-w-0 bg-white p-2 pb-[2px]">
          <div className="h-full flex flex-col min-h-0">
            <div className="flex-1 min-h-0 bg-slate-100 rounded-xl border border-slate-700 p-2 overflow-hidden">
              <Chat />
            </div>
          </div>
        </div>

        {/* 右侧竖条 */}
        <div className="w-[27%] min-w-0 overflow-y-auto bg-slate-50 border-l border-slate-200 p-4 space-y-2">
          {/* 日历图标按钮，点击跳转到 /chat/token */}
          {/* <Link
            href="/chat/token"
            title="Token Diary"
            className="flex items-center justify-center w-full py-3 rounded-lg border border-cyan-400/30 bg--900/80 text-cyanblue-200 hover:bg-cyan-500/10 hover:border-cyan-300/60 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          >
            <CalendarIcon className="w-6 h-6" />
            <span className="ml-2 font-bold text-cyanblue-500">
              Token Usage Diary
            </span>
          </Link> */}
          <Card>
            <Button
              className="w-full inset-shadow-card-foreground bg-white-400/30 text-cyanblue-200 hover:bg-cyan-500/10 hover:border-cyan-300/60 transition-all"
              onClick={() => setOpen(true)}
            >
              TOKEN USAGE VIEW
            </Button>
            <TokenCalendarDialog open={open} onOpenChange={setOpen} />
          </Card>

          <Card className="bg-white shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-lg">LOG PANEL</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              RUNNING LOGS
              <div className="mt-4 p-3 bg-blue-50 rounded-md text-blue-700">
                📊 LOGS...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
