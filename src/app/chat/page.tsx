"use client";
import Chat from "./chatpage";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Space } from "antd";

export default function Layout() {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* 1. 顶部横条：高度占整体的 10% */}
      <div className="w-full h-[10%] bg-slate-900 text-cyan-300 flex items-center px-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">🦚 iAgent</h1>
        <div className="ml-auto">
          <Button variant="outline" className="text-blue-500 border-slate-600">
            EXIT
          </Button>
        </div>
      </div>

      {/* 2. 下方三个竖条区域：宽度比例 3:4:3 */}
      {/* ⚠️ flex-1 的同时必须 min-h-0：否则内容高时这一行不会被压缩（min-height:auto），
          会整条撑出视口，导致顶部横条/左右栏跟着页面一起滚动 */}
      <div className="flex flex-1 min-h-0 w-full ">
        {/* 左侧竖条 (3份) */}
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
                {["项目 1", "项目 2", "项目 3"].map((item) => (
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
                {["项目 1", "项目 2", "项目 3"].map((item) => (
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
                {["项目 1", "项目 2", "项目 3"].map((item) => (
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

        {/* 中间竖条 (4份) - 核心内容区 */}
        <div className="w-[46%] min-w-0 bg-white p-2 pb-[2px]">
          {/* 🚨 关键改动 1：锁定高度，防止被撑大 */}
          <div className="h-full flex flex-col min-h-0">
            {/* 🚨 关键改动 2：外层 card 不再做滚动，滚动完全交给 Chat 内部的
                消息区（overflow-y-auto），这样顶部横条永远固定，不会被子区域
                的滚动影响，只会在中间的 card 内部上下滚动。 */}
            <div className="flex-1 min-h-0 bg-slate-100 rounded-xl border border-slate-700 p-2 overflow-hidden">
              <Chat />
            </div>
          </div>
        </div>

        {/* 右侧竖条 (3份) */}
        <div className="w-[27%] min-w-0 overflow-y-auto bg-slate-50 border-l border-slate-200 p-4">
          <Card className="bg-white shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-lg">右侧面板</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              右侧信息展示区。
              <div className="mt-4 p-3 bg-blue-50 rounded-md text-blue-700">
                📊 统计信息 / 通知
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
