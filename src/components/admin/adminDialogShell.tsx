/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

export function AdminDialogShell({
  open,
  onOpenChange,
  title,
  children,
  toolbar,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: ReactNode;
  children: ReactNode;
  toolbar?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="flex h-[80vh] w-full max-w-6xl flex-col rounded-2xl border border-cyan-400/30 bg-slate-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部 */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-400/20">
          <h2 className="text-sm font-mono font-bold text-cyan-400">{title}</h2>
          <div className="flex items-center gap-2">
            {toolbar}
            <button
              id="close-btn"
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-cyan-400/30 px-3 py-1.5 text-xs text-slate-300 hover:bg-cyan-500/10 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> CLOSE
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 min-h-0 mt-4 overflow-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
