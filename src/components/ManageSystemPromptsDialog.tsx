"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminDialogShell } from "./admin/adminDialogShell";
import { AdminTable } from "./admin/adminTable";
import { AdminFormField } from "./admin/adminFormField";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Save,
  ArrowLeft,
  Brain,
  FileText,
  Type,
  Star,
  Loader2,
  Sparkles,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==========================================
// 🎨 System Prompt 专属样式（Violet 主题）
// 背景网格保持 cyan 以维持全局统一，仅交互元素使用 violet
// ==========================================
const PROMPT_STYLES = `
  /* --- 动态背景网格（全局统一 cyan） --- */
  .prompt-dialog-bg {
    background-image:
      linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .prompt-dialog-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.02) 50%, transparent 100%);
    background-size: 100% 200%;
    animation: prompt-scanline 8s linear infinite;
    pointer-events: none;
    z-index: 0;
  }
  @keyframes prompt-scanline {
    0% { background-position: 0% 0%; }
    100% { background-position: 0% 200%; }
  }

  /* --- 表单玻璃卡片（violet 光线） --- */
  .prompt-glass-form .glass-field-wrapper {
    @apply p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all duration-300 relative overflow-hidden;
  }
  .prompt-glass-form .glass-field-wrapper::after {
    content: '';
    @apply absolute top-0 left-0 w-full h-[1px];
    background: linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .prompt-glass-form .glass-field-wrapper:hover {
    @apply border-white/[0.12] bg-white/[0.05];
  }
  .prompt-glass-form .glass-field-wrapper:hover::after { opacity: 1; }

  /* --- 输入框覆盖（violet focus） --- */
  .prompt-glass-form input,
  .prompt-glass-form textarea,
  .prompt-glass-form select {
    @apply !bg-black/30 !border-white/10 !text-slate-200 !placeholder:text-slate-600 !rounded-lg !transition-all !duration-300;
  }
  .prompt-glass-form input:focus,
  .prompt-glass-form textarea:focus,
  .prompt-glass-form select:focus {
    @apply !border-violet-500/50 !ring-1 !ring-violet-500/20 !outline-none !shadow-[0_0_12px_rgba(139,92,246,0.15)];
  }
  .prompt-glass-form label {
    @apply !text-xs !font-semibold !uppercase !tracking-widest !text-slate-400 !mb-2 !flex !items-center !gap-2;
  }

  /* --- Content 编辑器特殊样式 --- */
  .prompt-glass-form textarea[prompt-editor] {
    @apply !font-mono !text-sm !leading-relaxed !resize-y;
    tab-size: 2;
  }

  /* --- Save 按钮脉冲（violet） --- */
  @keyframes prompt-btn-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.3); }
    50% { box-shadow: 0 0 30px rgba(139,92,246,0.5); }
  }
  .prompt-btn-save:not(:disabled) { animation: prompt-btn-pulse 2s ease-in-out infinite; }
`;

type SystemPrompt = {
  id?: number;
  system_prompt_name: string;
  system_prompt_content: string;
  system_prompt_format?: string;
  is_default: boolean;
};

const EMPTY: SystemPrompt = {
  system_prompt_name: "",
  system_prompt_content: "",
  system_prompt_format: "plain",
  is_default: false,
};

export function ManageSystemPromptsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [list, setList] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<SystemPrompt | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system_prompts");
      const data = await res.json();
      setList(data.systemPrompts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const url = editing.id
        ? `/api/admin/system_prompts/${editing.id}`
        : "/api/admin/system_prompts";
      const method = editing.id ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      await load();
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("确定删除这个 System Prompt 吗？")) return;
    await fetch(`/api/admin/system_prompts/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <>
      <style>{PROMPT_STYLES}</style>

      <AdminDialogShell
        open={open}
        onOpenChange={onOpenChange}
        title="MANAGE SYSTEM PROMPTS"
        toolbar={
          <div className="flex items-center justify-between w-full gap-4">
            {!editing && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase tracking-wider">
                <div className="p-1.5 rounded-md bg-violet-500/10 border border-violet-500/20">
                  <Brain className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span>AI Cognitive Core</span>
              </div>
            )}

            {!editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing({ ...EMPTY })}
                className={cn(
                  "h-9 px-4 text-xs font-medium tracking-wide ml-auto",
                  "bg-violet-500/10 text-violet-300 border border-violet-500/30",
                  "hover:bg-violet-500/20 hover:text-violet-200 hover:border-violet-400/50",
                  "shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all duration-300",
                )}
              >
                <Plus className="w-4 h-4 mr-2" /> NEW PROMPT
              </Button>
            )}
          </div>
        }
      >
        {/* 动态网格背景（扫描线使用 violet 微调） */}
        <div className="prompt-dialog-bg absolute inset-0 pointer-events-none z-0" />
        {/* 装饰光斑（violet + fuchsia） */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-violet-500/8 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-fuchsia-600/8 rounded-full blur-[100px] pointer-events-none z-0" />

        {!editing ? (
          <div className="relative z-10">
            <AdminTable
              columns={["Name", "Format", "Default", "Preview"]}
              loading={loading}
              emptyText="No system prompts configured. Click NEW PROMPT to create one."
              rows={list.map((p, idx) => ({
                id: p.id!,
                cells: [
                  <span
                    key="n"
                    className="font-mono text-sm text-violet-300 flex items-center gap-2.5"
                  >
                    <span className="text-[10px] text-slate-600 w-4 text-right tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500/60 animate-pulse flex-shrink-0" />
                    {p.system_prompt_name}
                  </span>,
                  <span
                    key="f"
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 border border-white/10 text-slate-400"
                  >
                    {p.system_prompt_format ?? "plain"}
                  </span>,
                  <span key="d">
                    {p.is_default ? (
                      <span className="inline-flex items-center gap-1 text-amber-400/80 text-xs font-bold uppercase tracking-wider">
                        <Star className="w-3 h-3 fill-amber-400/80" /> Default
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </span>,
                  <span
                    key="p"
                    className="text-slate-500 truncate max-w-md inline-block text-xs font-mono leading-relaxed"
                    title={p.system_prompt_content}
                  >
                    {p.system_prompt_content?.slice(0, 80) || "(empty)"}
                    {(p.system_prompt_content?.length ?? 0) > 80 && "..."}
                  </span>,
                ],
              }))}
              onEdit={(id) => {
                const p = list.find((x) => x.id === id);
                if (p) setEditing(p);
              }}
              onDelete={remove}
            />

            {/* 空状态 */}
            {!loading && list.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-violet-500/30" />
                </div>
                <p className="text-xs text-slate-600 font-mono uppercase tracking-widest">
                  No Prompts Defined
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="prompt-glass-form relative z-10 space-y-5 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* 返回导航 + 面包屑 */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="group flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-violet-300 transition-colors"
              >
                <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-violet-500/10 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
                BACK TO LIST
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase tracking-wider">
                <Brain className="w-4 h-4 text-violet-400" />
                <span className="text-slate-600">/</span>
                <span className="text-violet-400/80">
                  {editing.id
                    ? editing.system_prompt_name || "Edit Prompt"
                    : "New Prompt"}
                </span>
              </div>
            </div>

            {/* === 基础信息组 === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-field-wrapper">
                <AdminFormField
                  label="Prompt Name"
                  value={editing.system_prompt_name ?? ""}
                  onChange={(v) =>
                    setEditing({ ...editing, system_prompt_name: v })
                  }
                />
              </div>
              <div className="glass-field-wrapper">
                <AdminFormField
                  label="Format"
                  value={editing.system_prompt_format ?? "plain"}
                  onChange={(v) =>
                    setEditing({ ...editing, system_prompt_format: v })
                  }
                />
              </div>
            </div>

            {/* === Content 编辑器（核心区域，视觉强调） === */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-violet-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Prompt Content
                </h3>
                <span className="text-[10px] text-slate-600 font-mono">
                  {editing.system_prompt_content?.length ?? 0} chars
                </span>
              </div>

              <div className="glass-field-wrapper !p-0">
                <AdminFormField
                  label=""
                  value={editing.system_prompt_content ?? ""}
                  onChange={(v) =>
                    setEditing({ ...editing, system_prompt_content: v })
                  }
                  textarea
                  rows={14}
                />
              </div>
            </div>

            {/* === Default 开关 === */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={editing.is_default}
                    onChange={(e) =>
                      setEditing({ ...editing, is_default: e.target.checked })
                    }
                  />
                  <div className="w-10 h-5 rounded-full bg-slate-800 border border-slate-700 peer-checked:bg-violet-500/20 peer-checked:border-violet-500/50 transition-all duration-300" />
                  <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-slate-500 peer-checked:bg-violet-400 peer-checked:translate-x-5 transition-all duration-300 shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
                </div>
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" />
                  Set as Default Prompt
                </span>
              </label>
            </div>

            {/* === 操作栏 === */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(null)}
                className="text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={save}
                disabled={saving}
                className={cn(
                  "min-w-[120px] prompt-btn-save",
                  "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500",
                  "text-white border-0",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none transition-all duration-300",
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> SAVING
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> SAVE CHANGES
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </AdminDialogShell>
    </>
  );
}
