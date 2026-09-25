/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
"use client";

import { useState } from "react";
import { Database, Settings2 } from "lucide-react";
import RagDetailDialog from "./RagDetailDialog";
import { useI18n } from "./i18n-provider";

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
  const { t } = useI18n();
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
        className="glow-card group flex cursor-pointer flex-col rounded-xl p-5 text-left"
      >
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Database className="size-4 text-cyan-600 dark:text-cyan-400" />
            {name}
          </h3>
          <span
            className={`relative flex size-2.5 ${
              status === "online"
                ? "text-emerald-500"
                : "text-red-500"
            }`}
          >
            <span className="status-dot relative inline-flex size-2.5 rounded-full bg-current" />
          </span>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">{t("rag.vector")}</p>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-foreground/80">
            📄 {sourceCount} {t("rag.sources")}
          </span>
          <span className="flex items-center gap-1 text-xs text-cyan-600 opacity-40 transition group-hover:opacity-100 dark:text-cyan-400">
            <Settings2 className="size-3" />
            {t("rag.setup")}
          </span>
        </div>
      </div>

      {open && (
        <RagDetailDialog onClose={() => setOpen(false)} onChanged={onRefresh} />
      )}
    </>
  );
}