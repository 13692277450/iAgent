"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Wrench, Server, BookAIcon, Cpu } from "lucide-react";
import { ManageSkillsDialog } from "./ManageSkillsDialog";
import { ManageMCPServersDialog } from "./ManageMCPServersDialog";
import { ManageSystemPromptsDialog } from "./ManageSystemPromptsDialog";
import { ManageLLMDialog } from "./ManageLLMDialog";
import { useMcp } from "./mcp_provider";
import { useI18n } from "./i18n-provider";

export function SystemSettingsCard() {
  const { refresh: refreshMcp } = useMcp(); // 👈 拿到 refresh
  const { t } = useI18n();

  const [openDialog, setOpenDialog] = useState<
    "skills" | "mcp" | "prompts" | "llm" | null
  >(null);

  const buttons = [
    {
      key: "skills" as const,
      label: t("sidebar.manageSkills"),
      icon: Wrench,
    },
    {
      key: "mcp" as const,
      label: t("sidebar.manageMcp"),
      icon: Server,
    },
    {
      key: "prompts" as const,
      label: t("sidebar.managePrompts"),
      icon: BookAIcon,
    },
    {
      key: "llm" as const,
      label: t("sidebar.manageLlm"),
      icon: Cpu,
    },
  ];

  return (
    <>
      <Card className="glow-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
            <Settings className="size-4" />
            {t("sidebar.systemSettings")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-2">
          {buttons.map((b) => {
            const Icon = b.icon;
            return (
              <button
                key={b.key}
                type="button"
                onClick={() => setOpenDialog(b.key)}
                className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-primary/10 hover:text-cyan-600 dark:hover:text-cyan-400"
              >
                <Icon className="size-4 text-cyan-600 dark:text-cyan-400" />
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
        onChanged={refreshMcp}
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