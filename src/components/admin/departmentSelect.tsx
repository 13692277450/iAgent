"use client";

import { useEffect, useState } from "react";

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
        className="w-full mt-1 px-2 py-1 rounded bg-slate-900 border border-cyan-400/30 text-xs text-slate-100 outline-none focus:border-cyan-400"
      >
        <option value="">-- 选择部门 --</option>
        {departments.map((d) => (
          <option key={d.code} value={d.code}>
            {d.name} ({d.code})
          </option>
        ))}
      </select>
    );
  }

  // 多选：用 checkbox 列表
  return (
    <div className="mt-1 max-h-32 overflow-y-auto rounded bg-slate-900 border border-cyan-400/30 p-2 space-y-1">
      {departments.length === 0 ? (
        <div className="text-xs text-slate-500">加载中…</div>
      ) : (
        departments.map((d) => (
          <label
            key={d.code}
            className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={value.includes(d.code)}
              onChange={(e) => {
                if (e.target.checked) onChange([...value, d.code]);
                else onChange(value.filter((c) => c !== d.code));
              }}
            />
            {d.name} <span className="text-slate-500">({d.code})</span>
          </label>
        ))
      )}
    </div>
  );
}
