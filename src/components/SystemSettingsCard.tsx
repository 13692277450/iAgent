"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Wrench, Server, BookAIcon, Cpu } from "lucide-react";
import { ManageSkillsDialog } from "./ManageSkillsDialog";
import { ManageMCPServersDialog } from "./ManageMCPServersDialog";
import { ManageSystemPromptsDialog } from "./ManageSystemPromptsDialog";
import { ManageLLMDialog } from "./ManageLLMDialog";

export function SystemSettingsCard() {
  const [openDialog, setOpenDialog] = useState<
    "skills" | "mcp" | "prompts" | "llm" | null
  >(null);

  const buttons = [
    { key: "skills" as const, label: "Manage Skills", icon: Wrench },
    { key: "mcp" as const, label: "Manage MCP Servers", icon: Server },
    { key: "prompts" as const, label: "Manage System Prompt", icon: BookAIcon },
    { key: "llm" as const, label: "Manage LLM", icon: Cpu },
  ];

  return (
    <>
      <Card className="bg-slate-950 border border-cyan-400/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-cyan-400 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            SYSTEM SETTINGS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 space-y-1">
          {buttons.map((b) => {
            const Icon = b.icon;
            return (
              <button
                key={b.key}
                type="button"
                onClick={() => setOpenDialog(b.key)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors text-left"
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                {b.label}
              </button>
            );
          })}
        </CardContent>
      </Card>

      <ManageSkillsDialog
        open={openDialog === "skills"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
      />
      <ManageMCPServersDialog
        open={openDialog === "mcp"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
      />
      <ManageSystemPromptsDialog
        open={openDialog === "prompts"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
      />
      <ManageLLMDialog
        open={openDialog === "llm"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
      />
    </>
  );
}
