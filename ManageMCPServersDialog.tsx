// Manage MCP Servers Dialog, ManageMCPServersDialog
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
  Shield,
  X,
  Server,
  Globe,
  Radio,
  Terminal,
  Lock,
  Key,
  User,
  ChevronRight,
  Loader2,
  Zap,
} from "lucide-react";
import { log } from "@/lib/logger";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

// ==========================================
// 🎨 MCP 专用玻璃态 + 科技网格样式系统
// ==========================================
const MCP_STYLES = `
  /* --- 动态背景网格（与 Skill Manager 一致） --- */
  .mcp-dialog-bg {
    background-image:
      linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .mcp-dialog-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(6,182,212,0.02) 50%, transparent 100%);
    background-size: 100% 200%;
    animation: mcp-scanline 8s linear infinite;
    pointer-events: none;
    z-index: 0;
  }
  @keyframes mcp-scanline {
    0% { background-position: 0% 0%; }
    100% { background-position: 0% 200%; }
  }

  /* --- 表单玻璃卡片 --- */
  .mcp-glass-form .glass-field-wrapper {
    @apply p-4 rounded-xl bg-muted/40 border border-border transition-all duration-300 relative overflow-hidden;
  }
  .mcp-glass-form .glass-field-wrapper::after {
    content: '';
    @apply absolute top-0 left-0 w-full h-[1px];
    background: linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .mcp-glass-form .glass-field-wrapper:hover {
    @apply border-border bg-muted/60;
  }
  .mcp-glass-form .glass-field-wrapper:hover::after { opacity: 1; }

  /* --- 输入框覆盖 --- */
  .mcp-glass-form input,
  .mcp-glass-form textarea,
  .mcp-glass-form select {
    @apply !bg-card !border-border !text-foreground !placeholder:text-muted-foreground !rounded-lg !transition-all !duration-300;
  }
  .mcp-glass-form input:focus,
  .mcp-glass-form textarea:focus,
  .mcp-glass-form select:focus {
    @apply !border-cyan-500/50 !ring-1 !ring-cyan-500/20 !outline-none !shadow-[0_0_12px_rgba(6,182,212,0.15)];
  }
  .mcp-glass-form label {
    @apply !text-xs !font-semibold !uppercase !tracking-widest !text-muted-foreground !mb-2 !flex !items-center !gap-2;
  }

  /* --- Save 按钮脉冲 --- */
  @keyframes mcp-btn-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(6,182,212,0.3); }
    50% { box-shadow: 0 0 30px rgba(6,182,212,0.5); }
  }
  .mcp-btn-save:not(:disabled) { animation: mcp-btn-pulse 2s ease-in-out infinite; }

  /* --- 访问控制用户条目 --- */
  .access-item {
    @apply flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40 border border-border transition-all duration-200;
  }
  .access-item:hover {
    @apply bg-muted/60 border-border;
  }
`;

// 连接类型图标映射
const CONNECTION_ICONS: Record<string, typeof Globe> = {
  http: Globe,
  sse: Radio,
  stdio: Terminal,
};

// 认证类型图标映射
const AUTH_ICONS: Record<string, typeof Lock> = {
  none: Lock,
  bearer: Key,
  api_key: Key,
  basic: User,
};

type MCPServer = {
  id?: number;
  name: string;
  description: string;
  connection_type: string;
  connection_api: any;
  auth_type: string;
  auth_config?: any;
  permission: string;
  enabled: boolean;
  tools: any[];
};

type Access = {
  id: number;
  username: string;
  permission: string;
  granted_at: string;
};

const EMPTY: MCPServer = {
  name: "",
  description: "",
  connection_type: "http",
  connection_api: { url: "" },
  auth_type: "none",
  permission: "read",
  enabled: false,
  tools: [],
};

export function ManageMCPServersDialog({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged?: () => void;
}) {
  const [list, setList] = useState<MCPServer[]>([]);
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<MCPServer | null>(null);
  const [saving, setSaving] = useState(false);
  const [accessList, setAccessList] = useState<Access[]>([]);
  const [newUser, setNewUser] = useState("");
  const [newPerm, setNewPerm] = useState("read");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mcp_servers");
      const data = await res.json();
      setList(data.mcpServers ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAccess = useCallback(async (serverId: number) => {
    const res = await fetch(`/api/admin/mcp_servers/${serverId}/access`);
    const data = await res.json();
    setAccessList(data.access ?? []);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (editing?.id) loadAccess(editing.id);
    else setAccessList([]);
  }, [editing?.id, loadAccess]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const url = editing.id
        ? `/api/admin/mcp_servers/${editing.id}`
        : "/api/admin/mcp_servers";
      const method = editing.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editing,
          connection_api:
            typeof editing.connection_api === "string"
              ? JSON.parse(editing.connection_api)
              : editing.connection_api,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
      onChanged?.(); // 👈 通知外层刷新
      setEditing(null);
    } catch (err) {
      log("[MCP] save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm(t("admin.mcpDeleteConfirm"))) return;
    await fetch(`/api/admin/mcp_servers/${id}`, { method: "DELETE" });
    await load();
    onChanged?.(); // 👈 通知外层刷新
  };

  const grantAccess = async () => {
    if (!editing?.id || !newUser.trim()) return;
    await fetch(`/api/admin/mcp_servers/${editing.id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUser, permission: newPerm }),
    });
    setNewUser("");
    await loadAccess(editing.id);
  };

  const revokeAccess = async (accessId: number) => {
    if (!editing?.id) return;
    await fetch(
      `/api/admin/mcp_servers/${editing.id}/access?accessId=${accessId}`,
      { method: "DELETE" },
    );
    await loadAccess(editing.id);
  };

  // 获取连接类型图标
  const getConnectionIcon = (type: string) => {
    const Icon = CONNECTION_ICONS[type] || Server;
    return <Icon className="w-3.5 h-3.5" />;
  };

  // 获取权限颜色
  const getPermColor = (perm: string) => {
    switch (perm) {
      case "admin":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "write":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
    }
  };

  return (
    <>
      <style>{MCP_STYLES}</style>

      <AdminDialogShell
        open={open}
        onOpenChange={onOpenChange}
        title={t("admin.mcpTitle")}
        toolbar={
          <div className="flex items-center justify-between w-full gap-4">
            {!editing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
                <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span>{t("admin.mcpSubtitle")}</span>
              </div>
            )}

            {!editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setEditing({
                    ...EMPTY,
                    connection_api: JSON.stringify(
                      EMPTY.connection_api,
                      null,
                      2,
                    ),
                  })
                }
                className={cn(
                  "h-9 px-4 text-xs font-medium tracking-wide ml-auto",
                  "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30",
                  "hover:bg-cyan-500/20 hover:text-cyan-200 hover:border-cyan-400/50",
                  "shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300",
                )}
              >
                <Plus className="w-4 h-4 mr-2" /> {t("admin.mcpNew")}
              </Button>
            )}
          </div>
        }
      >
        {/* 动态网格背景 */}
        <div className="mcp-dialog-bg absolute inset-0 pointer-events-none z-0" />
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-600/8 rounded-full blur-[100px] pointer-events-none z-0" />

        {!editing ? (
          <div className="relative z-10">
            <AdminTable
              columns={[
                t("admin.mcpColName"),
                t("admin.mcpColConnection"),
                t("admin.mcpColAuth"),
                t("admin.mcpColPermission"),
                t("admin.mcpColStatus"),
              ]}
              loading={loading}
              emptyText={t("admin.mcpEmpty")}
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
                  <span
                    key="t"
                    className="inline-flex items-center gap-1.5 text-foreground text-xs"
                  >
                    <span className="text-cyan-400/70">
                      {getConnectionIcon(s.connection_type)}
                    </span>
                    <span className="font-mono uppercase">
                      {s.connection_type}
                    </span>
                  </span>,
                  <span
                    key="a"
                    className="inline-flex items-center gap-1.5 text-muted-foreground text-xs"
                  >
                    {(() => {
                      const AuthIcon = AUTH_ICONS[s.auth_type] || Lock;
                      return <AuthIcon className="w-3 h-3" />;
                    })()}
                    <span className="font-mono uppercase">{s.auth_type}</span>
                  </span>,
                  <span
                    key="p"
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                      getPermColor(s.permission),
                    )}
                  >
                    {s.permission}
                  </span>,
                  <span
                    key="s"
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      s.enabled
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                        : "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {s.enabled ? t("admin.active") : t("admin.inactive")}
                  </span>,
                ],
              }))}
              onEdit={(id) => {
                const s = list.find((x) => x.id === id);
                if (s)
                  setEditing({
                    ...s,
                    connection_api: JSON.stringify(s.connection_api, null, 2),
                  });
              }}
              onDelete={remove}
            />

            {/* 空状态 */}
            {!loading && list.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mb-4">
                  <Server className="w-8 h-8 text-cyan-500/30" />
                </div>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                  {t("admin.mcpEmptyList")}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mcp-glass-form relative z-10 space-y-5 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* 返回导航 + 面包屑 */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="group flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-200 transition-colors"
              >
                <div className="p-1.5 rounded-md bg-muted group-hover:bg-cyan-500/10 transition-colors">
                  <ArrowLeft className="w-2.5 h-2.5" />
                </div>
                {t("admin.backToList")}
              </button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="text-muted-foreground/60">/</span>
                <span className="text-cyan-600 dark:text-cyan-400/80">
                  {editing.id ? editing.name || t("admin.mcpEdit") : t("admin.mcpCreate")}
                </span>
              </div>
            </div>

            {/* === 基础信息组 === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-field-wrapper">
                <AdminFormField
                  label={t("admin.mcpName")}
                  value={editing.name}
                  onChange={(v) => setEditing({ ...editing, name: v })}
                />
              </div>
              <div className="glass-field-wrapper">
                <AdminFormField
                  label={t("admin.mcpPermission")}
                  value={editing.permission}
                  onChange={(v) => setEditing({ ...editing, permission: v })}
                />
              </div>
            </div>

            <div className="glass-field-wrapper">
              <AdminFormField
                label={t("admin.mcpDescription")}
                value={editing.description}
                onChange={(v) => setEditing({ ...editing, description: v })}
                textarea
                rows={2}
              />
            </div>

            {/* === 连接配置组 === */}
            <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                <h3 className="text-xs font-semibold text-cyan-600 dark:text-cyan-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                <Globe className="w-4 h-4" /> {t("admin.llmConnection")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-field-wrapper !p-3">
                  <AdminFormField
                    label={t("admin.mcpConnectionType")}
                    value={editing.connection_type}
                    onChange={(v) =>
                      setEditing({ ...editing, connection_type: v })
                    }
                  />
                </div>
                <div className="glass-field-wrapper !p-3">
                  <AdminFormField
                    label={t("admin.mcpAuthType")}
                    value={editing.auth_type}
                    onChange={(v) => setEditing({ ...editing, auth_type: v })}
                  />
                </div>
              </div>

              <div className="glass-field-wrapper !p-3">
                <AdminFormField
                  label={t("admin.mcpApi")}
                  value={
                    typeof editing.connection_api === "string"
                      ? editing.connection_api
                      : JSON.stringify(editing.connection_api, null, 2)
                  }
                  onChange={(v) =>
                    setEditing({ ...editing, connection_api: v })
                  }
                  textarea
                  rows={13}
                />
              </div>
            </div>

            {/* === Enabled 开关 === */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={editing.enabled}
                    onChange={(e) =>
                      setEditing({ ...editing, enabled: e.target.checked })
                    }
                  />
                  <div className="w-10 h-5 rounded-full bg-muted border border-border peer-checked:bg-cyan-500/20 peer-checked:border-cyan-500/50 transition-all duration-300" />
                  <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-muted-foreground/60 peer-checked:bg-cyan-400 peer-checked:translate-x-5 transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  {t("admin.enabledLabel")}
                </span>
              </label>
            </div>

            {/* === 访问控制面板（仅编辑模式显示） === */}
            {editing.id && (
              <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                <h3 className="text-xs font-semibold text-amber-600 dark:text-amber-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Shield className="w-4 h-4" /> {t("admin.mcpAccessTitle")}
                </h3>

                {/* 已授权用户列表 */}
                <div className="space-y-2">
                  {accessList.length === 0 ? (
                    <div className="flex items-center justify-center py-6 rounded-lg border border-dashed border-border bg-muted/30">
                      <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                        {t("admin.mcpNoUsers")}
                      </span>
                    </div>
                  ) : (
                    accessList.map((a) => (
                      <div key={a.id} className="access-item">
                        {/* 用户头像占位 */}
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-border flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-cyan-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-sm text-foreground block truncate">
                            {a.username}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {a.granted_at}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex-shrink-0",
                            getPermColor(a.permission),
                          )}
                        >
                          {a.permission}
                        </span>
                        <button
                          type="button"
                          onClick={() => revokeAccess(a.id)}
                          className="p-1.5 rounded-md text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                          title={t("admin.mcpRevoke")}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* 新增授权表单 */}
                {/* === 新增授权表单（修复下拉菜单可读性） === */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <div className="flex-1 glass-field-wrapper !p-2 !rounded-lg">
                    <input
                      value={newUser}
                      onChange={(e) => setNewUser(e.target.value)}
                      placeholder={t("admin.mcpUsernamePlaceholder")}
                      className="w-full !py-1.5 !text-xs"
                    />
                  </div>

                  {/* ✅ 修复：使用自定义下拉样式 + 显式深色背景 */}
                  <div className="glass-field-wrapper !p-0 !rounded-lg w-28 flex-shrink-0 relative">
                    <select
                      value={newPerm}
                      onChange={(e) => setNewPerm(e.target.value)}
                      className={cn(
                        "w-full !py-1.5 !px-3 !text-xs !appearance-none",
                        "!bg-card !text-foreground !border-border",
                        "focus:!border-cyan-500/50 focus:!ring-1 focus:!ring-cyan-500/20",
                        "!rounded-lg !cursor-pointer",
                      )}
                    >
                      <option
                        value="read"
                        className="bg-card text-foreground"
                      >
                        read
                      </option>
                      <option
                        value="write"
                        className="bg-card text-foreground"
                      >
                        write
                      </option>
                      <option
                        value="admin"
                        className="bg-card text-foreground"
                      >
                        admin
                      </option>
                    </select>
                    {/* 自定义下拉箭头图标（替代原生箭头） */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <svg
                        aria-label={t("admin.mcpSelectPermission")}
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 1L5 5L9 1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={grantAccess}
                    disabled={!newUser.trim()}
                    className={cn(
                      "h-[32px] px-4 text-xs font-medium flex-shrink-0",
                      "bg-cyan-600 hover:bg-cyan-500 text-white border-0",
                      "disabled:opacity-30 disabled:cursor-not-allowed transition-all",
                    )}
                  >
                    <ChevronRight className="w-3.5 h-3.5 mr-1" />{" "}
                    {t("admin.grant")}
                  </Button>
                </div>
              </div>
            )}

            {/* === 操作栏 === */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(null)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all"
              >
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={save}
                disabled={saving}
                className={cn(
                  "min-w-[120px] mcp-btn-save",
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
                    <Save className="w-4 h-4 mr-2" /> {t("common.saveChanges")}
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
