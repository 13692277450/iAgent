/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
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
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="group flex w-[260px] cursor-pointer flex-col rounded-xl border border-slate-700 bg-slate-800 p-5 text-left shadow-lg transition hover:border-blue-500 hover:bg-slate-750"
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

        <p className="mt-1 text-xs text-slate-400">RAG Vector Knowledge Base</p>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-slate-300">
            📄 {sourceCount} DataSource
          </span>
          <span className="text-xs text-cyan-600 opacity-40 transition group-hover:opacity-100">
            SETUP →
          </span>
        </div>
      </div>

      {open && (
        <RagDetailDialog onClose={() => setOpen(false)} onChanged={onRefresh} />
      )}
    </>
  );
}
