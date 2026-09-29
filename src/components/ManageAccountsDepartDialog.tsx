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
  Users,
  Building2,
  Shield,
  ShieldOff,
  Star,
  Loader2,
  UserCog,
} from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

// ==========================================
// 🎨 样式（延续 Orange/Amber 主题）
// ==========================================
const STYLES = `
  .admin-dialog-bg {
    background-image:
      linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .admin-dialog-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(249,115,22,0.02) 50%, transparent 100%);
    background-size: 100% 200%;
    animation: admin-scanline 8s linear infinite;
    pointer-events: none;
    z-index: 0;
  }
  @keyframes admin-scanline {
    0% { background-position: 0% 0%; }
    100% { background-position: 0% 200%; }
  }
  .admin-glass-form .glass-field-wrapper {
    @apply p-4 rounded-xl bg-muted/40 border border-border transition-all duration-300 relative overflow-hidden;
  }
  .admin-glass-form .glass-field-wrapper::after {
    content: '';
    @apply absolute top-0 left-0 w-full h-[1px];
    background: linear-gradient(90deg, transparent, rgba(249,115,22,0.3), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .admin-glass-form .glass-field-wrapper:hover {
    @apply border-border bg-muted/60;
  }
  .admin-glass-form .glass-field-wrapper:hover::after { opacity: 1; }
  .admin-glass-form input,
  .admin-glass-form textarea,
  .admin-glass-form select {
    @apply !bg-card !border-border !text-foreground !placeholder:text-muted-foreground !rounded-lg !transition-all !duration-300;
  }
  .admin-glass-form input:focus,
  .admin-glass-form textarea:focus,
  .admin-glass-form select:focus {
    @apply !border-orange-500/50 !ring-1 !ring-orange-500/20 !outline-none !shadow-[0_0_12px_rgba(249,115,22,0.15)];
  }
  .admin-glass-form label {
    @apply !text-xs !font-semibold !uppercase !tracking-widest !text-muted-foreground !mb-2 !flex !items-center !gap-2;
  }
  @keyframes admin-btn-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.3); }
    50% { box-shadow: 0 0 30px rgba(249,115,22,0.5); }
  }
  .admin-btn-save:not(:disabled) { animation: admin-btn-pulse 2s ease-in-out infinite; }

  /* 下拉框样式 */
  .admin-glass-form select {
    @apply w-full h-10 px-3 text-sm cursor-pointer appearance-none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
  }
`;

type Account = {
  id?: number;
  username: string;
  password: string;
  department: string;
  islocker: boolean;
  isAdmin: boolean;
};

type Department = {
  id?: number;
  code: string;
  name: string;
  short_name: string;
  parent_id: number | null;
  manager: string | null;
  description: string | null;
  is_active: boolean;
};

const EMPTY_ACCOUNT: Account = {
  username: "",
  password: "",
  department: "",
  islocker: false,
  isAdmin: false,
};

const EMPTY_DEPT: Department = {
  code: "",
  name: "",
  short_name: "",
  parent_id: null,
  manager: null,
  description: null,
  is_active: true,
};

export function ManageAccountsDepartmentsDialog({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged?: () => void;
}) {
  const { t } = useI18n();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, deptRes] = await Promise.all([
        fetch("/api/admin/accounts", { cache: "no-store" }),
        fetch("/api/admin/departments", { cache: "no-store" }),
      ]);
      const accData = await accRes.json();
      const deptData = await deptRes.json();
      setAccounts(accData.accounts ?? []);
      setDepartments(deptData.departments ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // ---------- 保存账号 ----------
  const saveAccount = async () => {
    if (!editingAccount) return;
    setSaving(true);
    try {
      const url = editingAccount.id
        ? `/api/admin/accounts/${editingAccount.id}`
        : "/api/admin/accounts";
      const method = editingAccount.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAccount),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "保存账号失败");
        return;
      }
      onChanged?.();
      await load();
      setEditingAccount(null);
    } finally {
      setSaving(false);
    }
  };

  // ---------- 保存部门 ----------
  const saveDept = async () => {
    if (!editingDept) return;
    setSaving(true);
    try {
      const url = editingDept.id
        ? `/api/admin/departments/${editingDept.id}`
        : "/api/admin/departments";
      const method = editingDept.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingDept),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "保存部门失败");
        return;
      }
      onChanged?.();
      await load();
      setEditingDept(null);
    } finally {
      setSaving(false);
    }
  };

  // ---------- 删除 ----------
  const removeAccount = async (id: number) => {
    if (!confirm("确认删除该账号？")) return;
    const res = await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "删除账号失败");
      return;
    }
    onChanged?.();
    await load();
  };

  const removeDept = async (id: number) => {
    if (!confirm("确认删除该部门？")) return;
    const res = await fetch(`/api/admin/departments/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "删除部门失败");
      return;
    }
    onChanged?.();
    await load();
  };

  const isEditing = editingAccount !== null || editingDept !== null;

  return (
    <>
      <style>{STYLES}</style>

      <AdminDialogShell
        open={open}
        onOpenChange={onOpenChange}
        title="账号与部门管理"
        toolbar={
          <div className="flex items-center justify-between w-full gap-4">
            {!isEditing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
                <div className="p-1.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                  <UserCog className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <span>组织与权限</span>
              </div>
            )}

            {!isEditing && (
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAccount({ ...EMPTY_ACCOUNT })}
                  className={cn(
                    "h-9 px-4 text-xs font-medium tracking-wide",
                    "bg-orange-500/10 text-orange-300 border border-orange-500/30",
                    "hover:bg-orange-500/20 hover:text-orange-200 hover:border-orange-400/50",
                    "shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all duration-300",
                  )}
                >
                  <Plus className="w-4 h-4 mr-2" /> 新建账号
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingDept({ ...EMPTY_DEPT })}
                  className={cn(
                    "h-9 px-4 text-xs font-medium tracking-wide",
                    "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30",
                    "hover:bg-cyan-500/20 hover:text-cyan-200 hover:border-cyan-400/50",
                    "shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300",
                  )}
                >
                  <Plus className="w-4 h-4 mr-2" /> 新建部门
                </Button>
              </div>
            )}
          </div>
        }
      >
        <div className="admin-dialog-bg absolute inset-0 pointer-events-none z-0" />
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-500/8 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-600/8 rounded-full blur-[100px] pointer-events-none z-0" />

        {!isEditing ? (
          // ============ 列表视图 ============
          <div className="relative z-10 space-y-8">
            {/* 账号列表 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400/80">
                  账号
                </h3>
              </div>
              <AdminTable
                columns={["用户名", "部门", "管理员", "状态"]}
                loading={loading}
                emptyText="暂无账号"
                rows={accounts.map((a, idx) => ({
                  id: a.id!,
                  cells: [
                    <span
                      key="u"
                      className="font-mono text-sm text-orange-600 dark:text-orange-300 flex items-center gap-2.5"
                    >
                      <span className="text-[10px] text-muted-foreground w-4 text-right tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60 animate-pulse flex-shrink-0" />
                      {a.username}
                    </span>,
                    <span
                      key="d"
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-muted border border-border text-foreground"
                    >
                      {a.department || "—"}
                    </span>,
                    <span key="a">
                      {a.isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-amber-400/80 text-xs font-bold uppercase tracking-wider">
                          <Shield className="w-3 h-3 fill-amber-400/80" />
                          管理员
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          普通用户
                        </span>
                      )}
                    </span>,
                    <span key="s">
                      {a.islocker ? (
                        <span className="inline-flex items-center gap-1 text-rose-400/80 text-xs font-bold uppercase">
                          <ShieldOff className="w-3 h-3" /> 已锁定
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400/80 text-xs font-bold uppercase">
                          <Star className="w-3 h-3" /> 正常
                        </span>
                      )}
                    </span>,
                  ],
                }))}
                onEdit={(id) => {
                  const a = accounts.find((x) => x.id === id);
                  if (a) setEditingAccount(a);
                }}
                onDelete={removeAccount}
              />
            </section>

            {/* 部门列表 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400/80">
                  部门
                </h3>
              </div>
              <AdminTable
                columns={["代码", "名称", "简称", "负责人", "状态"]}
                loading={loading}
                emptyText="暂无部门"
                rows={departments.map((d, idx) => ({
                  id: d.id!,
                  cells: [
                    <span
                      key="c"
                      className="font-mono text-sm text-cyan-600 dark:text-cyan-300 flex items-center gap-2.5"
                    >
                      <span className="text-[10px] text-muted-foreground w-4 text-right tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 animate-pulse flex-shrink-0" />
                      {d.code}
                    </span>,
                    <span key="n" className="text-sm text-foreground">
                      {d.name}
                    </span>,
                    <span key="s" className="text-xs text-muted-foreground">
                      {d.short_name || "—"}
                    </span>,
                    <span key="m" className="text-xs text-muted-foreground">
                      {d.manager || "—"}
                    </span>,
                    <span key="a">
                      {d.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400/80 text-xs font-bold uppercase">
                          <Star className="w-3 h-3" /> 启用
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground text-xs font-bold uppercase">
                          <ShieldOff className="w-3 h-3" /> 停用
                        </span>
                      )}
                    </span>,
                  ],
                }))}
                onEdit={(id) => {
                  const d = departments.find((x) => x.id === id);
                  if (d) setEditingDept(d);
                }}
                onDelete={removeDept}
              />
            </section>
          </div>
        ) : editingAccount !== null ? (
          // ============ 账号编辑视图 ============
          <div className="admin-glass-form relative z-10 space-y-5 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="group flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-orange-600 dark:hover:text-orange-300 transition-colors"
              >
                <div className="p-1.5 rounded-md bg-muted group-hover:bg-orange-500/10 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
                返回列表
              </button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
                <Users className="w-4 h-4 text-orange-400" />
                <span className="text-muted-foreground/60">/</span>
                <span className="text-orange-600 dark:text-orange-400/80">
                  {editingAccount.id
                    ? editingAccount.username || "编辑账号"
                    : "新建账号"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-field-wrapper">
                <AdminFormField
                  label="用户名"
                  value={editingAccount.username}
                  onChange={(v) =>
                    setEditingAccount((prev) =>
                      prev ? { ...prev, username: v } : prev,
                    )
                  }
                />
              </div>
              <div className="glass-field-wrapper">
                <AdminFormField
                  label="密码"
                  value={editingAccount.password}
                  onChange={(v) =>
                    setEditingAccount((prev) =>
                      prev ? { ...prev, password: v } : prev,
                    )
                  }
                  showToggle
                />
              </div>
            </div>

            {/* 所属部门：下拉选择 */}
            <div className="glass-field-wrapper">
              <label
                htmlFor="department"
                className="!text-xs !font-semibold !uppercase !tracking-widest !text-muted-foreground !mb-2 !flex !items-center !gap-2"
              >
                所属部门
              </label>
              <select
                value={editingAccount.department}
                onChange={(e) =>
                  setEditingAccount((prev) =>
                    prev ? { ...prev, department: e.target.value } : prev,
                  )
                }
              >
                <option value="">— 请选择部门 —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.name}（{d.code}）
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={editingAccount.isAdmin}
                    onChange={(e) =>
                      setEditingAccount((prev) =>
                        prev ? { ...prev, isAdmin: e.target.checked } : prev,
                      )
                    }
                  />
                  <div className="w-10 h-5 rounded-full bg-muted border border-border peer-checked:bg-orange-500/20 peer-checked:border-orange-500/50 transition-all duration-300" />
                  <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-muted-foreground/60 peer-checked:bg-orange-400 peer-checked:translate-x-5 transition-all duration-300 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> 管理员
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={editingAccount.islocker}
                    onChange={(e) =>
                      setEditingAccount((prev) =>
                        prev ? { ...prev, islocker: e.target.checked } : prev,
                      )
                    }
                  />
                  <div className="w-10 h-5 rounded-full bg-muted border border-border peer-checked:bg-rose-500/20 peer-checked:border-rose-500/50 transition-all duration-300" />
                  <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-muted-foreground/60 peer-checked:bg-rose-400 peer-checked:translate-x-5 transition-all duration-300 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1.5">
                  <ShieldOff className="w-3.5 h-3.5" /> 锁定账号
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingAccount(null)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={saveAccount}
                disabled={saving}
                className={cn(
                  "min-w-[120px] admin-btn-save",
                  "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500",
                  "text-white border-0",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none transition-all duration-300",
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 保存中
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> 保存
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : editingDept !== null ? (
          // ============ 部门编辑视图 ============
          <div className="admin-glass-form relative z-10 space-y-5 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="group flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
              >
                <div className="p-1.5 rounded-md bg-muted group-hover:bg-cyan-500/10 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
                返回列表
              </button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-muted-foreground/60">/</span>
                <span className="text-cyan-600 dark:text-cyan-400/80">
                  {editingDept.id ? editingDept.name || "编辑部门" : "新建部门"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-field-wrapper">
                <AdminFormField
                  label="部门代码"
                  value={editingDept.code}
                  onChange={(v) =>
                    setEditingDept((prev) =>
                      prev ? { ...prev, code: v } : prev,
                    )
                  }
                />
              </div>
              <div className="glass-field-wrapper">
                <AdminFormField
                  label="部门名称"
                  value={editingDept.name}
                  onChange={(v) =>
                    setEditingDept((prev) =>
                      prev ? { ...prev, name: v } : prev,
                    )
                  }
                />
              </div>
              <div className="glass-field-wrapper">
                <AdminFormField
                  label="简称"
                  value={editingDept.short_name}
                  onChange={(v) =>
                    setEditingDept((prev) =>
                      prev ? { ...prev, short_name: v } : prev,
                    )
                  }
                />
              </div>

              {/* 负责人：从用户列表下拉选择 */}
              {/* <p> </p> */}
              <div className="glass-field-wrapper">
                <label
                  htmlFor="manager"
                  className="!text-xs !font-semibold !uppercase !tracking-widest !mb-2 !flex !items-center !gap-2 text-cyan-600 dark:text-cyan-400"
                >
                  负责人
                </label>
                <select
                  value={editingDept.manager ?? ""}
                  onChange={(e) =>
                    setEditingDept((prev) =>
                      prev
                        ? { ...prev, manager: e.target.value || null }
                        : prev,
                    )
                  }
                  className="w-full h-11 px-3 rounded-lg bg-card border border-border text-foreground text-xs
               focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none
               focus:shadow-[0_0_12px_rgba(6,182,212,0.15)]
               transition-all duration-300 cursor-pointer appearance-none
               bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239ca3af%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')]
               bg-no-repeat bg-[right_0.75rem_center] pr-8"
                >
                  <option value="">— 请选择负责人 —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.username}>
                      {a.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="glass-field-wrapper">
              <AdminFormField
                label="描述"
                value={editingDept.description ?? ""}
                onChange={(v) =>
                  setEditingDept((prev) =>
                    prev ? { ...prev, description: v || null } : prev,
                  )
                }
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={editingDept.is_active}
                  onChange={(e) =>
                    setEditingDept((prev) =>
                      prev ? { ...prev, is_active: e.target.checked } : prev,
                    )
                  }
                />
                <div className="w-10 h-5 rounded-full bg-muted border border-border peer-checked:bg-cyan-500/20 peer-checked:border-cyan-500/50 transition-all duration-300" />
                <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-muted-foreground/60 peer-checked:bg-cyan-400 peer-checked:translate-x-5 transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" /> 启用部门
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingDept(null)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={saveDept}
                disabled={saving}
                className={cn(
                  "min-w-[120px]",
                  "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500",
                  "text-white border-0",
                  "disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300",
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 保存中
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> 保存
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </AdminDialogShell>
    </>
  );
}
