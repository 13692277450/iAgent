// src/components/skills-dialog.tsx
"use client";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useSkills } from "./skills-provider";
import { useI18n } from "@/components/i18n-provider";

const TYPE_COLOR: Record<string, string> = {
  http: "text-cyan-600 dark:text-cyan-300",
  function: "text-emerald-600 dark:text-emerald-400",
  mcp: "text-purple-600 dark:text-purple-300",
};

const AUTH_COLOR: Record<string, string> = {
  none: "text-muted-foreground",
  api_key: "text-yellow-600 dark:text-yellow-300",
  bearer: "text-orange-600 dark:text-orange-300",
  basic: "text-pink-600 dark:text-pink-300",
};

export function SkillsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { skills, selected, toggle, isSelected } = useSkills();
  const { t } = useI18n();
  const [keyword, setKeyword] = useState("");

  // fuzzy search: name + display_name + description
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return skills;
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(kw) ||
        (s.display_name ?? "").toLowerCase().includes(kw) ||
        s.description.toLowerCase().includes(kw),
    );
  }, [skills, keyword]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-[min(1000px,92vw)] flex-col bg-popover text-popover-foreground border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-wide text-cyan-600 dark:text-cyan-400">
            {t("skills.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("skills.description")}
          </DialogDescription>
        </DialogHeader>

        {/* search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/70" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("skills.searchPlaceholder")}
            className="border-border bg-card pl-9 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-primary/30"
          />
        </div>

        {/* skills table */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-card/60 custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted backdrop-blur-sm">
              <tr className="text-cyan-600 dark:text-cyan-400">
                <th className="w-10 px-2 py-2"></th>
                <th className="px-2 py-2 text-left font-mono text-xs">
                  {t("skills.name")}
                </th>
                <th className="px-2 py-2 text-left font-mono text-xs">
                  {t("skills.display")}
                </th>
                <th className="px-2 py-2 text-left font-mono text-xs">
                  {t("skills.type")}
                </th>
                <th className="px-2 py-2 text-left font-mono text-xs">
                  {t("skills.auth")}
                </th>
                <th className="px-2 py-2 text-left font-mono text-xs">
                  {t("skills.descriptionCol")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    {t("skills.noResult")}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const checked = isSelected(s.id);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => toggle(s)}
                      className={`cursor-pointer border-t border-border transition-colors hover:bg-primary/10 ${
                        checked ? "bg-primary/10" : ""
                      }`}
                    >
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(s)}
                          onClick={(e) => e.stopPropagation()}
                          className="size-4 cursor-pointer accent-cyan-600"
                        />
                      </td>
                      <td className="px-2 py-2 font-mono text-xs text-foreground">
                        {s.name}
                      </td>
                      <td className="px-2 py-2 font-medium text-foreground">
                        {s.display_name ?? "-"}
                      </td>
                      <td
                        className={`px-2 py-2 text-xs ${TYPE_COLOR[s.handler_type] ?? "text-muted-foreground"}`}
                      >
                        {s.handler_type}
                      </td>
                      <td
                        className={`px-2 py-2 text-xs ${AUTH_COLOR[s.auth_type ?? "none"] ?? "text-muted-foreground"}`}
                      >
                        {s.auth_type ?? "none"}
                      </td>
                      <td className="max-w-[280px] truncate px-2 py-2 text-xs text-muted-foreground">
                        {s.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* selected skills */}
        <div className="border-t border-border pt-3">
          <div className="mb-2 text-xs font-semibold tracking-wide text-cyan-600 dark:text-cyan-400">
            {t("skills.selected")}
          </div>
          <div className="flex max-h-[80px] flex-wrap gap-1.5 overflow-y-auto custom-scrollbar">
            {selected.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">
                {t("common.none")}
              </span>
            ) : (
              selected.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/15 px-2 py-0.5 text-xs text-cyan-700 dark:text-cyan-300"
                >
                  {s.display_name ?? s.name}
                </span>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
