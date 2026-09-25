// src/components/skills-selected-card.tsx
"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Trash2 } from "lucide-react";
import { useSkills } from "./skills-provider";
import { useI18n } from "@/components/i18n-provider";
import { SkillsDialog } from "./skills-dialog";

const TYPE_COLOR: Record<string, string> = {
  http: "text-cyan-600 dark:text-cyan-300",
  function: "text-emerald-600 dark:text-emerald-400",
  mcp: "text-purple-600 dark:text-purple-300",
};

export function SkillsSelectedCard() {
  const { selected, cleanAll } = useSkills();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="glow-card flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
            <Wrench className="size-4" />
            {t("sidebar.skills")}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 p-3">
          {/* 小表格：name + type */}
          {selected.length === 0 ? (
            <div className="py-2 text-xs text-muted-foreground italic">
              {t("sidebar.noSkill")}
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr className="text-cyan-600 dark:text-cyan-400">
                    <th className="px-2 py-1 text-left font-medium">
                      {t("skills.name")}
                    </th>
                    <th className="px-2 py-1 text-left font-medium">
                      {t("skills.type")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-2 py-1 text-foreground">
                        {s.display_name ?? s.name}
                      </td>
                      <td
                        className={`px-2 py-1 text-xs ${TYPE_COLOR[s.handler_type] ?? "text-muted-foreground"}`}
                      >
                        {s.handler_type}
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
              {t("sidebar.allSkills")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={cleanAll}
              disabled={selected.length === 0}
              className="h-8 text-xs bg-card text-red-600 dark:text-red-400 border border-border shadow-sm hover:bg-red-500/10 disabled:opacity-40"
            >
              <Trash2 className="size-3.5 mr-1" />
              {t("sidebar.cleanAll")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <SkillsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}