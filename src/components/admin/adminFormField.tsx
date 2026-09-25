"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export function AdminFormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  textarea,
  rows = 6,
  showToggle = false,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
  showToggle?: boolean;
}) {
  const id = useId();
  const safeValue = value ?? "";
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  const effectiveType = showToggle ? (visible ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} className="text-xs text-cyan-600 dark:text-cyan-400">
        {label}
      </label>

      {textarea ? (
        <textarea
          id={id}
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="mt-1 w-full rounded border border-border bg-card px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
        />
      ) : showToggle ? (
        <div className="relative mt-1">
          <input
            id={id}
            type={effectiveType}
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded border border-border bg-card px-3 py-2 pr-10 text-sm text-foreground outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary"
            title={visible ? t("admin.hide") : t("admin.show")}
            aria-label={visible ? t("admin.hideApiKey") : t("admin.showApiKey")}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <input
          id={id}
          type={type}
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      )}
    </div>
  );
}
