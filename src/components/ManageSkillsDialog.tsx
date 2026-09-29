/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AdminDialogShell } from "./admin/adminDialogShell";
import { AdminTable } from "./admin/adminTable";
import { AdminFormField } from "./admin/adminFormField";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Save,
  ArrowLeft,
  Cpu,
  Zap,
  ShieldCheck,
  Loader2,
  Hash,
  Type,
  FileText,
  Globe,
  Link,
  Code2,
  ToggleLeft,
  Star,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { log } from "@/lib/logger";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

// ==========================================
// 🎨 增强版玻璃态 + 科技网格样式系统
// ==========================================
const ENHANCED_STYLES = `
  .skill-dialog-bg {
    background-image:
      linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .skill-dialog-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(6,182,212,0.02) 50%, transparent 100%);
    background-size: 100% 200%;
    animation: scanline 8s linear infinite;
    pointer-events: none;
    z-index: 0;
  }
  @keyframes scanline {
    0% { background-position: 0% 0%; }
    100% { background-position: 0% 200%; }
  }
  .skill-glass-form .glass-field-wrapper {
    @apply p-4 rounded-xl bg-muted/40 border border-border transition-all duration-300 relative overflow-hidden;
  }
  .skill-glass-form .glass-field-wrapper::after {
    content: '';
    @apply absolute top-0 left-0 w-full h-[1px];
    background: linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .skill-glass-form .glass-field-wrapper:hover {
    @apply border-border bg-muted/60;
  }
  .skill-glass-form .glass-field-wrapper:hover::after {
    opacity: 1;
  }
  .skill-glass-form input,
  .skill-glass-form textarea,
  .skill-glass-form select {
    @apply !bg-card !border-border !text-foreground !placeholder:text-muted-foreground !rounded-lg !transition-all !duration-300;
  }
  .skill-glass-form input:focus,
  .skill-glass-form textarea:focus,
  .skill-glass-form select:focus {
    @apply !border-cyan-500/50 !ring-1 !ring-cyan-500/20 !outline-none !shadow-[0_0_12px_rgba(6,182,212,0.15)];
  }
  .skill-glass-form label {
    @apply !text-xs !font-semibold !uppercase !tracking-widest !text-muted-foreground !mb-2 !flex !items-center !gap-2;
  }
  @keyframes btn-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(6,182,212,0.3); }
    50% { box-shadow: 0 0 30px rgba(6,182,212,0.5); }
  }
  .btn-save-glow:not(:disabled) {
    animation: btn-pulse 2s ease-in-out infinite;
  }
`;

type Skill = {
  id?: number;
  name: string;
  display_name: string;
  description: string;
  input_schema: any;
  output_schema?: any;
  handler_type: string;
  endpoint: string;
  handler_ref: string;
  auth_type: string;
  enabled: boolean;
  is_default: boolean;
};

const EMPTY: Skill = {
  name: "",
  display_name: "",
  description: "",
  input_schema: { type: "object", properties: {} },
  handler_type: "http",
  endpoint: "",
  handler_ref: "",
  auth_type: "none",
  enabled: true,
  is_default: false,
};

export function ManageSkillsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useI18n();
  const [list, setList] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [saving, setSaving] = useState(false);

  // 导入相关状态
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
  });
  const [importResult, setImportResult] = useState<{
    total: number;
    successCount: number;
    failCount: number;
    results: Array<{
      name: string;
      success: boolean;
      error?: string;
      action?: string;
    }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/skills");
      const data = await res.json();
      setList(data.skills ?? []);
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
        ? `/api/admin/skills/${editing.id}`
        : "/api/admin/skills";
      const method = editing.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editing,
          input_schema:
            typeof editing.input_schema === "string"
              ? JSON.parse(editing.input_schema)
              : editing.input_schema,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
      setEditing(null);
    } catch (err) {
      log("[Skills] save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm(t("admin.skillsDeleteConfirm"))) return;
    await fetch(`/api/admin/skills/${id}`, { method: "DELETE" });
    await load();
  };

  // ---------- 导入处理 ----------
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setImporting(true);
    setImportProgress({ current: 0, total: files.length });

    const allSkills: any[] = [];
    const parseErrors: Array<{
      name: string;
      success: boolean;
      error: string;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        allSkills.push(...list);
      } catch (err: any) {
        parseErrors.push({
          name: file.name,
          success: false,
          error: `JSON 解析失败：${err.message}`,
        });
      }
      setImportProgress({ current: i + 1, total: files.length });
    }

    let backendResult: any = { results: [] };
    if (allSkills.length > 0) {
      try {
        const res = await fetch("/api/admin/skills/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skills: allSkills }),
        });
        backendResult = await res.json();
      } catch (err: any) {
        parseErrors.push({
          name: "批量导入请求",
          success: false,
          error: err.message,
        });
      }
    }

    const allResults = [...(backendResult.results ?? []), ...parseErrors];

    setImportResult({
      total: allResults.length,
      successCount: allResults.filter((r) => r.success).length,
      failCount: allResults.filter((r) => !r.success).length,
      results: allResults,
    });

    setImporting(false);
    await load();

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <style>{ENHANCED_STYLES}</style>

      <AdminDialogShell
        open={open}
        onOpenChange={onOpenChange}
        title={t("admin.skillsTitle")}
        toolbar={
          <div className="flex items-center justify-between w-full gap-4">
            {!editing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
                <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span>{t("admin.skillsSubtitle")}</span>
              </div>
            )}

            {!editing && (
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImportClick}
                  disabled={importing}
                  className={cn(
                    "h-9 px-4 text-xs font-medium tracking-wide",
                    "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
                    "hover:bg-emerald-500/20 hover:text-emerald-200 hover:border-emerald-400/50",
                    "shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300",
                  )}
                >
                  <Upload className="w-4 h-4 mr-2" /> 导入 Skill
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEditing({
                      ...EMPTY,
                      input_schema: JSON.stringify(EMPTY.input_schema, null, 2),
                    })
                  }
                  className={cn(
                    "h-9 px-4 text-xs font-medium tracking-wide",
                    "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30",
                    "hover:bg-cyan-500/20 hover:text-cyan-200 hover:border-cyan-400/50",
                    "shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300",
                  )}
                >
                  <Plus className="w-4 h-4 mr-2" /> {t("admin.skillsNew")}
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelected}
                />
              </div>
            )}
          </div>
        }
      >
        {/* 动态网格背景 + 扫描线 */}
        <div className="skill-dialog-bg absolute inset-0 pointer-events-none z-0" />
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-600/8 rounded-full blur-[100px] pointer-events-none z-0" />

        {!editing ? (
          <div className="relative z-10">
            <AdminTable
              columns={[
                t("admin.skillsColName"),
                t("admin.skillsColDisplay"),
                t("admin.skillsColType"),
                t("admin.skillsColStatus"),
                t("admin.skillsColDefault"),
              ]}
              loading={loading}
              emptyText={t("admin.skillsEmpty")}
              rows={list.map((s, idx) => ({
                id: s.id!,
                cells: [
                  <span
                    key="n"
                    className="font-mono text-sm text-cyan-600 dark:text-cyan-300 flex items-center gap-2.5"
                  >
                    <span className="text-[10px] text-muted-foreground w-4 text-right tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 animate-pulse flex-shrink-0" />
                    {s.name}
                  </span>,
                  <span key="d" className="text-foreground font-medium">
                    {s.display_name || "-"}
                  </span>,
                  <span
                    key="t"
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-muted border border-border text-muted-foreground"
                  >
                    {s.handler_type}
                  </span>,
                  <span
                    key="e"
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      s.enabled
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                        : "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {s.enabled ? t("admin.active") : t("admin.inactive")}
                  </span>,
                  <span key="def" className="text-muted-foreground">
                    {s.is_default && (
                      <span className="flex items-center gap-1 text-amber-400/80 text-xs">
                        <Star className="w-3 h-3 fill-amber-400/80" />
                        {t("admin.skillsColDefault")}
                      </span>
                    )}
                  </span>,
                ],
              }))}
              onEdit={(id) => {
                const s = list.find((x) => x.id === id);
                if (s)
                  setEditing({
                    ...s,
                    input_schema: JSON.stringify(s.input_schema, null, 2),
                  });
              }}
              onDelete={remove}
            />

            {!loading && list.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-cyan-500/30" />
                </div>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                  {t("admin.skillsEmptyList")}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="skill-glass-form relative z-10 space-y-5 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="group flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
              >
                <div className="p-1.5 rounded-md bg-muted group-hover:bg-cyan-500/10 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
                {t("admin.backToList")}
              </button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-muted-foreground/60">/</span>
                <span className="text-cyan-600 dark:text-cyan-400/80">
                  {editing.id
                    ? editing.name || t("admin.skillsEdit")
                    : t("admin.skillsCreate")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-field-wrapper">
                <AdminFormField
                  label={t("admin.skillsName")}
                  value={editing.name}
                  onChange={(v) => setEditing({ ...editing, name: v })}
                />
              </div>
              <div className="glass-field-wrapper">
                <AdminFormField
                  label={t("admin.skillsDisplay")}
                  value={editing.display_name}
                  onChange={(v) => setEditing({ ...editing, display_name: v })}
                />
              </div>
            </div>

            <div className="glass-field-wrapper">
              <AdminFormField
                label={t("admin.skillsDescription")}
                value={editing.description}
                onChange={(v) => setEditing({ ...editing, description: v })}
                textarea
                rows={3}
              />
            </div>

            <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

              <h3 className="text-xs font-semibold text-cyan-600 dark:text-cyan-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                <Zap className="w-4 h-4" /> {t("admin.skillsExecution")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-field-wrapper !p-3">
                  <AdminFormField
                    label={t("admin.skillsHandlerType")}
                    value={editing.handler_type}
                    onChange={(v) =>
                      setEditing({ ...editing, handler_type: v })
                    }
                  />
                </div>
                <div className="glass-field-wrapper !p-3 md:col-span-2">
                  <AdminFormField
                    label={t("admin.skillsEndpoint")}
                    value={editing.endpoint}
                    onChange={(v) => setEditing({ ...editing, endpoint: v })}
                  />
                </div>
              </div>

              <div className="glass-field-wrapper !p-3">
                <AdminFormField
                  label={t("admin.skillsHandlerRef")}
                  value={editing.handler_ref}
                  onChange={(v) => setEditing({ ...editing, handler_ref: v })}
                />
              </div>
            </div>

            <div className="glass-field-wrapper">
              <AdminFormField
                label={t("admin.skillsSchema")}
                value={
                  typeof editing.input_schema === "string"
                    ? editing.input_schema
                    : JSON.stringify(editing.input_schema, null, 2)
                }
                onChange={(v) => setEditing({ ...editing, input_schema: v })}
                textarea
                rows={8}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border">
              <div className="flex gap-6">
                {[
                  {
                    key: "enabled",
                    label: t("admin.enabledLabel"),
                    icon: Zap,
                  },
                  {
                    key: "is_default",
                    label: t("admin.setAsDefault"),
                    icon: ShieldCheck,
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={editing[item.key as keyof Skill] as boolean}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            [item.key]: e.target.checked,
                          })
                        }
                      />
                      <div className="w-10 h-5 rounded-full bg-muted border border-border peer-checked:bg-cyan-500/20 peer-checked:border-cyan-500/50 transition-all duration-300" />
                      <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-muted-foreground/60 peer-checked:bg-cyan-400 peer-checked:translate-x-5 transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1.5">
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(null)}
                  className="flex-1 sm:flex-none text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={save}
                  disabled={saving}
                  className={cn(
                    "flex-1 sm:flex-none min-w-[120px] btn-save-glow",
                    "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500",
                    "text-white border-0",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none transition-all duration-300",
                  )}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      {t("admin.savingUpper")}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />{" "}
                      {t("common.saveChanges")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============ 导入进度弹窗 ============ */}
        {importing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[420px] rounded-2xl bg-card border border-border p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                <h3 className="text-sm font-semibold text-foreground">
                  正在导入 Skill
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>读取文件</span>
                  <span>
                    {importProgress.current} / {importProgress.total}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                    style={{
                      width: `${
                        importProgress.total > 0
                          ? (importProgress.current / importProgress.total) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ 导入结果弹窗 ============ */}
        {importResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[560px] max-h-[80vh] rounded-2xl bg-card border border-border shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">
                  导入结果
                </h3>
                <button
                  type="button"
                  onClick={() => setImportResult(null)}
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="px-6 py-4 flex gap-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-foreground">
                    成功{" "}
                    <strong className="text-emerald-400">
                      {importResult.successCount}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-sm text-foreground">
                    失败{" "}
                    <strong className="text-rose-400">
                      {importResult.failCount}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    共 {importResult.total} 条
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-3">
                <ul className="space-y-2">
                  {importResult.results.map((r, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-start gap-2 text-xs rounded-lg px-3 py-2 border",
                        r.success
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-rose-500/5 border-rose-500/20",
                      )}
                    >
                      {r.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-foreground truncate">
                          {r.name}
                        </div>
                        {r.success && r.action && (
                          <div className="text-muted-foreground mt-0.5">
                            {r.action === "created" ? "已新建" : "已更新"}
                          </div>
                        )}
                        {!r.success && r.error && (
                          <div className="text-rose-400 mt-0.5 break-words">
                            {r.error}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-6 py-4 border-t border-border flex justify-end">
                <Button
                  size="sm"
                  onClick={() => setImportResult(null)}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border-0"
                >
                  关闭
                </Button>
              </div>
            </div>
          </div>
        )}
      </AdminDialogShell>
    </>
  );
}
