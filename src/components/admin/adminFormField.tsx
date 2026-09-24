"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function AdminFormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  textarea,
  rows = 6,
  showToggle = false, // 👈 新增
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
  showToggle?: boolean; // 👈 新增
}) {
  const id = useId();
  const safeValue = value ?? "";
  const [visible, setVisible] = useState(false);

  // 实际渲染的 input type：showToggle 且当前不可见时用 password
  const effectiveType = showToggle ? (visible ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} className="text-xs text-cyan-400">
        {label}
      </label>

      {textarea ? (
        <textarea
          id={id}
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full mt-1 px-3 py-2 rounded bg-slate-900 border border-cyan-400/30 text-sm text-slate-100 font-mono outline-none focus:border-cyan-400"
        />
      ) : showToggle ? (
        // 👇 带眼睛按钮的 input
        <div className="relative mt-1">
          <input
            id={id}
            type={effectiveType}
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 pr-10 rounded bg-slate-900 border border-cyan-400/30 text-sm text-slate-100 outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
            title={visible ? "Hide" : "Show"}
            aria-label={visible ? "Hide API Key" : "Show API Key"}
          >
            {visible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      ) : (
        <input
          id={id}
          type={type}
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full mt-1 px-3 py-2 rounded bg-slate-900 border border-cyan-400/30 text-sm text-slate-100 outline-none focus:border-cyan-400"
        />
      )}
    </div>
  );
}
