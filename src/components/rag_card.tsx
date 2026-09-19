// components/RagCard.tsx
"use client";

import { useState } from "react";
import RagDetailDialog from "./RagDetailDialog";

type Props = {
  name: string;
  status: "online" | "offline";
  sourceCount: number;
  onRefresh: () => void;
};

export default function RagCard({
  name,
  status,
  sourceCount,
  onRefresh,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex rounded-xl border border-slate-700 bg-slate-800 p-5 text-left shadow-lg transition group-hover:border-blue-500
                   hover:bg-slate-750"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">{name}</h3>
          <span
            className={`text-sm ${
              status === "online" ? "text-green-500" : "text-red-500"
            }`}
          >
            ●
          </span>
        </div>

        <p className="mt-1 text-xs text-slate-400">RAG 向量知识库 · MCP 服务</p>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-slate-300">
            📄 {sourceCount} 个数据源
          </span>
          <span className="text-xs text-blue-400 opacity-0 transition group-hover:opacity-100">
            查看详情 →
          </span>
        </div>
      </button>

      {open && (
        <RagDetailDialog onClose={() => setOpen(false)} onChanged={onRefresh} />
      )}
    </>
  );
}
