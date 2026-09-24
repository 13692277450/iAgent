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
  Cpu,
  Flame,
  Globe,
  Key,
  Star,
  Loader2,
  Zap,
  Eye,
  EyeOff,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==========================================
// 🎨 LLM 专属样式（Orange/Amber 主题）
// 背景网格保持全局 cyan 统一，交互元素使用 orange
// ==========================================
const LLM_STYLES = `
  /* --- 动态背景网格（全局统一 cyan 基底） --- */
  .llm-dialog-bg {
    background-image:
      linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .llm-dialog-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(249,115,22,0.02) 50%, transparent 100%);
    background-size: 100% 200%;
    animation: llm-scanline 8s linear infinite;
    pointer-events: none;
    z-index: 0;
  }
  @keyframes llm-scanline {
    0% { background-position: 0% 0%; }
    100% { background-position: 0% 200%; }
  }

  /* --- 表单玻璃卡片（orange 光线） --- */
  .llm-glass-form .glass-field-wrapper {
    @apply p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all duration-300 relative overflow-hidden;
  }
  .llm-glass-form .glass-field-wrapper::after {
    content: '';
    @apply absolute top-0 left-0 w-full h-[1px];
    background: linear-gradient(90deg, transparent, rgba(249,115,22,0.3), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .llm-glass-form .glass-field-wrapper:hover {
    @apply border-white/[0.12] bg-white/[0.05];
  }
  .llm-glass-form .glass-field-wrapper:hover::after { opacity: 1; }

  /* --- 输入框覆盖（orange focus） --- */
  .llm-glass-form input,
  .llm-glass-form textarea,
  .llm-glass-form select {
    @apply !bg-black/30 !border-white/10 !text-slate-200 !placeholder:text-slate-600 !rounded-lg !transition-all !duration-300;
  }
  .llm-glass-form input:focus,
  .llm-glass-form textarea:focus,
  .llm-glass-form select:focus {
    @apply !border-orange-500/50 !ring-1 !ring-orange-500/20 !outline-none !shadow-[0_0_12px_rgba(249,115,22,0.15)];
  }
  .llm-glass-form label {
    @apply !text-xs !font-semibold !uppercase !tracking-widest !text-slate-400 !mb-2 !flex !items-center !gap-2;
  }

  /* --- API Key 字段特殊样式 --- */
  .llm-glass-form .api-key-wrapper input {
    @apply !font-mono !text-sm !tracking-wider;
  }

  /* --- Save 按钮脉冲（orange） --- */
  @keyframes llm-btn-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.3); }
    50% { box-shadow: 0 0 30px rgba(249,115,22,0.5); }
  }
  .llm-btn-save:not(:disabled) { animation: llm-btn-pulse 2s ease-in-out infinite; }
`;

type LLM = {
  id?: number;
  llm_name: string;
  llm_apikey: string;
  llm_baseurl: string;
  llm_model: string;
  is_default: boolean;
};

const EMPTY: LLM = {
  llm_name: "",
  llm_apikey: "",
  llm_baseurl: "",
  llm_model: "",
  is_default: false,
};

export function ManageLLMDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [list, setList] = useState<LLM[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<LLM | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/llms");
      const data = await res.json();
      setList(data.llms ?? []);
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
        ? `/api/admin/llms/${editing.id}`
        : "/api/admin/llms";
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
    if (!confirm("确定删除这个 LLM 配置吗？")) return;
    await fetch(`/api/admin/llms/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <>
      <style>{LLM_STYLES}</style>

      <AdminDialogShell
        open={open}
        onOpenChange={onOpenChange}
        title="MANAGE LLM"
        toolbar={
          <div className="flex items-center justify-between w-full gap-4">
            {!editing && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase tracking-wider">
                <div className="p-1.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <span>Inference Engine Config</span>
              </div>
            )}

            {!editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing({ ...EMPTY })}
                className={cn(
                  "h-9 px-4 text-xs font-medium tracking-wide ml-auto",
                  "bg-orange-500/10 text-orange-300 border border-orange-500/30",
                  "hover:bg-orange-500/20 hover:text-orange-200 hover:border-orange-400/50",
                  "shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all duration-300",
                )}
              >
                <Plus className="w-4 h-4 mr-2" /> NEW PROVIDER
              </Button>
            )}
          </div>
        }
      >
        {/* 动态网格背景 */}
        <div className="llm-dialog-bg absolute inset-0 pointer-events-none z-0" />
        {/* 暖色装饰光斑 */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-500/8 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-rose-600/8 rounded-full blur-[100px] pointer-events-none z-0" />

        {!editing ? (
          <div className="relative z-10">
            <AdminTable
              columns={["Display Name", "Model", "Base URL", "Default"]}
              loading={loading}
              emptyText="No LLM providers configured. Click NEW PROVIDER to add one."
              rows={list.map((l, idx) => ({
                id: l.id!,
                cells: [
                  <span
                    key="n"
                    className="font-mono text-sm text-orange-300 flex items-center gap-2.5"
                  >
                    <span className="text-[10px] text-slate-600 w-4 text-right tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60 animate-pulse flex-shrink-0" />
                    {l.llm_name}
                  </span>,
                  <span
                    key="m"
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 border border-white/10 text-slate-300"
                  >
                    {l.llm_model}
                  </span>,
                  <span
                    key="u"
                    className="text-slate-500 text-xs font-mono truncate max-w-[200px] inline-block align-middle"
                    title={l.llm_baseurl}
                  >
                    {l.llm_baseurl}
                  </span>,
                  <span key="d">
                    {l.is_default ? (
                      <span className="inline-flex items-center gap-1 text-amber-400/80 text-xs font-bold uppercase tracking-wider">
                        <Star className="w-3 h-3 fill-amber-400/80" /> Default
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </span>,
                ],
              }))}
              onEdit={(id) => {
                const l = list.find((x) => x.id === id);
                if (l) setEditing(l);
              }}
              onDelete={remove}
            />

            {/* 空状态 */}
            {!loading && list.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center mb-4">
                  <Cpu className="w-8 h-8 text-orange-500/30" />
                </div>
                <p className="text-xs text-slate-600 font-mono uppercase tracking-widest">
                  No Inference Engines
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="llm-glass-form relative z-10 space-y-5 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* 返回导航 + 面包屑 */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="group flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-orange-300 transition-colors"
              >
                <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-orange-500/10 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
                BACK TO LIST
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase tracking-wider">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-slate-600">/</span>
                <span className="text-orange-400/80">
                  {editing.id
                    ? editing.llm_name || "Edit Provider"
                    : "New Provider"}
                </span>
              </div>
            </div>

            {/* === 基础信息组 === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-field-wrapper">
                <AdminFormField
                  label="Display Name"
                  value={editing.llm_name}
                  onChange={(v) => setEditing({ ...editing, llm_name: v })}
                />
              </div>
              <div className="glass-field-wrapper">
                <AdminFormField
                  label="Model Identifier"
                  value={editing.llm_model}
                  onChange={(v) => setEditing({ ...editing, llm_model: v })}
                />
              </div>
            </div>

            {/* === 连接配置组 === */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
              <h3 className="text-xs font-semibold text-orange-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                <Globe className="w-4 h-4" /> Connection Config
              </h3>

              <div className="glass-field-wrapper !p-3">
                <AdminFormField
                  label="Base URL"
                  value={editing.llm_baseurl}
                  onChange={(v) => setEditing({ ...editing, llm_baseurl: v })}
                />
              </div>

              {/* API Key - 安全敏感字段，独立视觉处理 */}
              <div className="glass-field-wrapper !p-3 api-key-wrapper relative">
                <div className="absolute top-3 right-3 z-10">
                  <ShieldAlert
                    className="w-4 h-4 text-amber-500/40"
                    aria-label="Sensitive credential"
                  />
                </div>
                <AdminFormField
                  label="API Key"
                  value={editing.llm_apikey}
                  onChange={(v) => setEditing({ ...editing, llm_apikey: v })}
                  showToggle
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
                  <div className="w-10 h-5 rounded-full bg-slate-800 border border-slate-700 peer-checked:bg-orange-500/20 peer-checked:border-orange-500/50 transition-all duration-300" />
                  <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-slate-500 peer-checked:bg-orange-400 peer-checked:translate-x-5 transition-all duration-300 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                </div>
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" />
                  Set as Default Provider
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
                  "min-w-[120px] llm-btn-save",
                  "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500",
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
