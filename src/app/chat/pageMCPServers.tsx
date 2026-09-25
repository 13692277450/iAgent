// src/components/mcp-selected-card.tsx
"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Trash2 } from "lucide-react";
import { useMcp } from "@/components/mcp_provider";
import { useI18n } from "@/components/i18n-provider";
import { McpServerDialog } from "./pageMCPServersDialog";

const STATUS_COLOR: Record<string, string> = {
  connected: "text-emerald-600 dark:text-emerald-400",
  error: "text-red-600 dark:text-red-400",
  unknown: "text-muted-foreground",
  disabled: "text-muted-foreground/60",
};

export function McpSelectedCard() {
  const { selected, cleanAll } = useMcp();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="glow-card flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
            <Server className="size-4" />
            {t("sidebar.mcp")}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 p-3">
          {/* 小表格：name + status */}
          {selected.length === 0 ? (
            <div className="py-2 text-xs text-muted-foreground italic">
              {t("sidebar.noMcp")}
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr className="text-cyan-600 dark:text-cyan-400">
                    <th className="px-2 py-1 text-left font-medium">
                      {t("mcp.name")}
                    </th>
                    <th className="px-2 py-1 text-left font-medium">
                      {t("mcp.status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-2 py-1 text-foreground">{s.name}</td>
                      <td
                        className={`px-2 py-1 ${STATUS_COLOR[s.status] ?? "text-muted-foreground"}`}
                      >
                        {s.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 两个按钮 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(true)}
              className="flex-1 h-8 text-xs bg-card text-foreground border border-border shadow-sm hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
            >
              {t("sidebar.allMcp")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={cleanAll}
              disabled={selected.length === 0}
              className="h-8 text-xs bg-card text-red-600 dark:text-red-400 border border-border shadow-sm hover:bg-red-500/10 disabled:opacity-40"
            >
              <Trash2 className="size-4 mr-1" />
              {t("sidebar.cleanAll")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 弹窗 */}
      <McpServerDialog open={open} onOpenChange={setOpen} />
    </>
  );
}