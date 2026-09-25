/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export function AdminDialogShell({
  open,
  onOpenChange,
  title,
  children,
  toolbar,
  maxWidth = "sm:max-w-[1200px]", // 👈 可配置
  height = "h-[80vh]", // 👈 可配置
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: ReactNode;
  children: ReactNode;
  toolbar?: ReactNode;
  maxWidth?: string;
  height?: string;
}) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={`glow-card flex ${height} w-full ${maxWidth} flex-col rounded-2xl p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏：只放标题和按钮，不要设置高度 */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-mono text-sm font-bold text-cyan-600 dark:text-cyan-400">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {toolbar}
            <button
              id="close-btn"
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> {t("common.close")}
            </button>
          </div>
        </div>

        {/* 内容区：flex-1 + overflow-auto */}
        <div className="custom-scrollbar mt-4 min-h-0 flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
