"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

export function DepartmentSelect({
  value,
  onChange,
  multiple = true,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  multiple?: boolean;
}) {
  const [departments, setDepartments] = useState<
    Array<{ code: string; name: string }>
  >([]);
  const { t } = useI18n();

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => setDepartments(d.departments ?? []))
      .catch(() => setDepartments([]));
  }, []);

  if (!multiple) {
    return (
      <select
        value={value[0] ?? ""}
        onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
        className="mt-1 w-full rounded border border-border bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
      >
        <option value="">{t("admin.selectDepartment")}</option>
        {departments.map((d) => (
          <option key={d.code} value={d.code}>
            {d.name} ({d.code})
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="mt-1 max-h-32 space-y-1 overflow-y-auto rounded border border-border bg-card p-2">
      {departments.length === 0 ? (
        <div className="text-xs text-muted-foreground">{t("common.loading")}</div>
      ) : (
        departments.map((d) => (
          <label
            key={d.code}
            className="flex cursor-pointer items-center gap-2 text-xs text-foreground"
          >
            <input
              type="checkbox"
              checked={value.includes(d.code)}
              onChange={(e) => {
                if (e.target.checked) onChange([...value, d.code]);
                else onChange(value.filter((c) => c !== d.code));
              }}
              className="accent-cyan-600"
            />
            {d.name} <span className="text-muted-foreground">({d.code})</span>
          </label>
        ))
      )}
    </div>
  );
}
