// src/components/skills-selected-card.tsx
"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Trash2 } from "lucide-react";
import { useSkills } from "./skills-provider";
import { SkillsDialog } from "./skills-dialog";

const TYPE_COLOR: Record<string, string> = {
  http: "text-cyan-300",
  function: "text-green-400",
  mcp: "text-purple-300",
};

export function SkillsSelectedCard() {
  const { selected, cleanAll } = useSkills();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="bg-slate-950 border border-cyan-400/30 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-cyan-400 flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            SKILLS
          </CardTitle>
        </CardHeader>

        <CardContent className="p-3 space-y-3">
          {/* 小表格：name + type */}
          {selected.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-2">
              No skill selected
            </div>
          ) : (
            <div className="rounded-md border border-cyan-400/20 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-900/60">
                  <tr className="text-cyan-400">
                    <th className="text-left px-2 py-1 font-mono">NAME</th>
                    <th className="text-left px-2 py-1 font-mono">TYPE</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((s) => (
                    <tr key={s.id} className="border-t border-cyan-400/10">
                      <td className="px-2 py-1 text-slate-200">
                        {s.display_name ?? s.name}
                      </td>
                      <td
                        className={`px-2 py-1 text-xs ${TYPE_COLOR[s.handler_type] ?? "text-slate-400"}`}
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
              className="flex-1 h-8 text-xs text-cyan-300 bg-slate-900/60 border border-cyan-400/30 hover:bg-cyan-500/10"
            >
              All Skills
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={cleanAll}
              disabled={selected.length === 0}
              className="h-8 text-xs text-red-300 bg-slate-900/60 border border-red-400/30 hover:bg-red-500/10 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clean All
            </Button>
          </div>
        </CardContent>
      </Card>

      <SkillsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
