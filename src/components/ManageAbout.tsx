/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/a11y/useValidAnchor: <explanation> */
"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminDialogShell } from "./admin/adminDialogShell";
import { useI18n } from "./i18n-provider";
import { Button } from "./assistant-ui/elements/button";

const currentVersion = "0.0.1";
type About = {
  id: number;
  version: string;
  buildTime: string;
  commitHash: string;
  commitMessage: string;
};

export function ManageAbout({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [about, setAbout] = useState<About | null>(null);
  const { t } = useI18n();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/about");
      const data = await res.json();
      setAbout(data.about ?? null);
    } catch (err) {
      console.error("[about] load failed:", err);
      setAbout(null);
    }
  }, []);

  useEffect(() => {
    if (open) load();
    else setAbout(null);
  }, [open, load]);

  return (
    <AdminDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("admin.aboutTitle")}
      maxWidth="sm:max-w-[600px]"
      height="sm:h-[400px]"
    >
      <div className="flex flex-col items-center justify-center gap-2 text-pretty ">
        <p>
          {t("admin.aboutVersion")}: {about?.version ?? "-"}
        </p>
        <p>
          {t("admin.aboutBuildTime")}: {about?.buildTime ?? "-"}
        </p>
        <p>
          {t("admin.aboutCommitHash")}: {about?.commitHash ?? "-"}
        </p>
        <p>
          {t("admin.aboutCommitMessage")}: {about?.commitMessage ?? "-"}
        </p>
        <p>
          {t("admin.aboutCurrentVersion")}: {currentVersion}
        </p>
        <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
        <div></div>
        <a
          href="https://www.aipercy.top/iagent/software/iagent.zip"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button type="button" onClick={() => onOpenChange(false)}>
            {t("admin.aboutUpgrade")}
          </Button>
        </a>
      </div>
    </AdminDialogShell>
  );
}
