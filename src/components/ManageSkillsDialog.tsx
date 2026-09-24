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
} from "lucide-react";
import { log } from "@/lib/logger";
import { cn } from "@/lib/utils";

// ==========================================
// 🎨 增强版玻璃态 + 科技网格样式系统
// ==========================================
const ENHANCED_STYLES = `
  /* --- 动态背景网格 --- */
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

  /* --- 表单玻璃卡片 --- */
  .skill-glass-form .glass-field-wrapper {
    @apply p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all duration-300 relative overflow-hidden;
  }
  .skill-glass-form .glass-field-wrapper::after {
    content: '';
    @apply absolute top-0 left-0 w-full h-[1px];
    background: linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .skill-glass-form .glass-field-wrapper:hover {
    @apply border-white/[0.12] bg-white/[0.05];
  }
  .skill-glass-form .glass-field-wrapper:hover::after {
    opacity: 1;
  }

  /* --- 输入框覆盖 --- */
  .skill-glass-form input,
  .skill-glass-form textarea,
  .skill-glass-form select {
    @apply !bg-black/30 !border-white/10 !text-slate-200 !placeholder:text-slate-600 !rounded-lg !transition-all !duration-300;
  }
  .skill-glass-form input:focus,
  .skill-glass-form textarea:focus,
  .skill-glass-form select:focus {
    @apply !border-cyan-500/50 !ring-1 !ring-cyan-500/20 !outline-none !shadow-[0_0_12px_rgba(6,182,212,0.15)];
  }
  .skill-glass-form label {
    @apply !text-xs !font-semibold !uppercase !tracking-widest !text-slate-400 !mb-2 !flex !items-center !gap-2;
  }

  /* --- Save 按钮脉冲光晕 --- */
  @keyframes btn-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(6,182,212,0.3); }
    50% { box-shadow: 0 0 30px rgba(6,182,212,0.5); }
  }
  .btn-save-glow:not(:disabled) {
    animation: btn-pulse 2s ease-in-out infinite;
  }

  /* --- 表格行左侧状态条 --- */
  .skill-table-row {
    position: relative;
  }
  .skill-table-row::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: transparent;
    transition: background 0.2s;
  }
  .skill-table-row:hover::before {
    background: rgb(6,182,212);
    box-shadow: 0 0 8px rgba(6,182,212,0.5);
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

// 表单字段配置：label + 图标映射
const FORM_FIELDS = {
  name: {
    label: "Skill Identifier",
    icon: Hash,
    placeholder: "e.g. web_search_v2",
  },
  display_name: {
    label: "Display Name",
    icon: Type,
    placeholder: "Human readable name",
  },
  description: {
    label: "Description",
    icon: FileText,
    placeholder: "Describe what this skill does...",
  },
  handler_type: {
    label: "Handler Type",
    icon: ToggleLeft,
    placeholder: "http / function / mcp",
  },
  endpoint: {
    label: "Endpoint URL",
    icon: Globe,
    placeholder: "https://api.example.com/v1/...",
  },
  handler_ref: {
    label: "Handler Reference",
    icon: Link,
    placeholder: "Module path or function name",
  },
  input_schema: {
    label: "Input Schema (JSON)",
    icon: Code2,
    placeholder: '{ "type": "object", ... }',
  },
} as const;

export function ManageSkillsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [list, setList] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [saving, setSaving] = useState(false);

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
    if (!confirm("确定要删除此技能吗？此操作不可撤销。")) return;
    await fetch(`/api/admin/skills/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <>
      <style>{ENHANCED_STYLES}</style>

      <AdminDialogShell
        open={open}
        onOpenChange={onOpenChange}
        title="SKILL MANAGER"
        toolbar={
          <div className="flex items-center justify-between w-full gap-4">
            {!editing && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase tracking-wider">
                <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span>System Intelligence Config</span>
              </div>
            )}

            {!editing && (
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
                  "h-9 px-4 text-xs font-medium tracking-wide ml-auto",
                  "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30",
                  "hover:bg-cyan-500/20 hover:text-cyan-200 hover:border-cyan-400/50",
                  "shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300",
                )}
              >
                <Plus className="w-4 h-4 mr-2" /> NEW SKILL
              </Button>
            )}
          </div>
        }
      >
        {/* 动态网格背景 + 扫描线 */}
        <div className="skill-dialog-bg absolute inset-0 pointer-events-none z-0" />
        {/* 装饰光斑 */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-600/8 rounded-full blur-[100px] pointer-events-none z-0" />

        {!editing ? (
          <div className="relative z-10">
            <AdminTable
              columns={[
                "Name",
                "Display Name",
                "Handler Type",
                "Status",
                "Default",
              ]}
              loading={loading}
              emptyText="No active skills detected. Click NEW SKILL to initialize."
              rows={list.map((s, idx) => ({
                id: s.id!,
                cells: [
                  // Name + 行号 + 脉冲点
                  <span
                    key="n"
                    className="font-mono text-sm text-cyan-300 flex items-center gap-2.5"
                  >
                    <span className="text-[10px] text-slate-600 w-4 text-right tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 animate-pulse flex-shrink-0" />
                    {s.name}
                  </span>,
                  <span key="d" className="text-slate-300 font-medium">
                    {s.display_name || "-"}
                  </span>,
                  <span
                    key="t"
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 border border-white/10 text-slate-400"
                  >
                    {s.handler_type}
                  </span>,
                  <span
                    key="e"
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      s.enabled
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                        : "bg-slate-800/50 text-slate-500 border-slate-700/50",
                    )}
                  >
                    {s.enabled ? "Active" : "Disabled"}
                  </span>,
                  <span key="def" className="text-slate-500">
                    {s.is_default && (
                      <span className="flex items-center gap-1 text-amber-400/80 text-xs">
                        <Star className="w-3 h-3 fill-amber-400/80" /> DEFAULT
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

            {/* 增强版空状态 */}
            {!loading && list.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-cyan-500/30" />
                </div>
                <p className="text-xs text-slate-600 font-mono uppercase tracking-widest">
                  Awaiting Configuration
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="skill-glass-form relative z-10 space-y-5 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* 返回导航 + 面包屑 */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="group flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-cyan-500/10 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
                BACK TO LIST
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-600">/</span>
                <span className="text-cyan-400/80">
                  {editing.id ? editing.name || "Edit Skill" : "New Skill"}
                </span>
              </div>
            </div>

            {/* 基础信息组 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-field-wrapper">
                <AdminFormField
                  label={FORM_FIELDS.name.label}
                  value={editing.name}
                  onChange={(v) => setEditing({ ...editing, name: v })}
                />
              </div>
              <div className="glass-field-wrapper">
                <AdminFormField
                  label={FORM_FIELDS.display_name.label}
                  value={editing.display_name}
                  onChange={(v) => setEditing({ ...editing, display_name: v })}
                />
              </div>
            </div>

            <div className="glass-field-wrapper">
              <AdminFormField
                label={FORM_FIELDS.description.label}
                value={editing.description}
                onChange={(v) => setEditing({ ...editing, description: v })}
                textarea
                rows={3}
              />
            </div>

            {/* 执行配置组 */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-4 relative overflow-hidden">
              {/* 分组顶部光线 */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

              <h3 className="text-xs font-semibold text-cyan-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                <Zap className="w-4 h-4" /> Execution Config
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-field-wrapper !p-3">
                  <AdminFormField
                    label={FORM_FIELDS.handler_type.label}
                    value={editing.handler_type}
                    onChange={(v) =>
                      setEditing({ ...editing, handler_type: v })
                    }
                  />
                </div>
                <div className="glass-field-wrapper !p-3 md:col-span-2">
                  <AdminFormField
                    label={FORM_FIELDS.endpoint.label}
                    value={editing.endpoint}
                    onChange={(v) => setEditing({ ...editing, endpoint: v })}
                  />
                </div>
              </div>

              <div className="glass-field-wrapper !p-3">
                <AdminFormField
                  label={FORM_FIELDS.handler_ref.label}
                  value={editing.handler_ref}
                  onChange={(v) => setEditing({ ...editing, handler_ref: v })}
                />
              </div>
            </div>

            {/* Schema 编辑器 */}
            <div className="glass-field-wrapper">
              <AdminFormField
                label={FORM_FIELDS.input_schema.label}
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

            {/* 开关 & 操作栏 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
              <div className="flex gap-6">
                {[
                  { key: "enabled", label: "Enabled", icon: Zap },
                  {
                    key: "is_default",
                    label: "Set as Default",
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
                      <div className="w-10 h-5 rounded-full bg-slate-800 border border-slate-700 peer-checked:bg-cyan-500/20 peer-checked:border-cyan-500/50 transition-all duration-300" />
                      <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-slate-500 peer-checked:bg-cyan-400 peer-checked:translate-x-5 transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                    </div>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors flex items-center gap-1.5">
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
                  className="flex-1 sm:flex-none text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                >
                  Cancel
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
          </div>
        )}
      </AdminDialogShell>
    </>
  );
}

//before UI optimize

// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { AdminDialogShell } from "./admin/adminDialogShell";
// import { AdminTable } from "./admin/adminTable";
// import { AdminFormField } from "./admin/adminFormField";
// import { Button } from "@/components/ui/button";
// import { Plus, Save, ArrowLeft } from "lucide-react";
// import { log } from "@/lib/logger";

// type Skill = {
//   id?: number;
//   name: string;
//   display_name: string;
//   description: string;
//   input_schema: any;
//   output_schema?: any;
//   handler_type: string;
//   endpoint: string;
//   handler_ref: string;
//   auth_type: string;
//   enabled: boolean;
//   is_default: boolean;
// };

// const EMPTY: Skill = {
//   name: "",
//   display_name: "",
//   description: "",
//   input_schema: { type: "object", properties: {} },
//   handler_type: "http",
//   endpoint: "",
//   handler_ref: "",
//   auth_type: "none",
//   enabled: true,
//   is_default: false,
// };

// export function ManageSkillsDialog({
//   open,
//   onOpenChange,
// }: {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;
// }) {
//   const [list, setList] = useState<Skill[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [editing, setEditing] = useState<Skill | null>(null);
//   const [saving, setSaving] = useState(false);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/admin/skills");
//       const data = await res.json();
//       setList(data.skills ?? []);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (open) load();
//   }, [open, load]);

//   const save = async () => {
//     if (!editing) return;
//     setSaving(true);
//     try {
//       const url = editing.id
//         ? `/api/admin/skills/${editing.id}`
//         : "/api/admin/skills";
//       const method = editing.id ? "PUT" : "POST";
//       const res = await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...editing,
//           input_schema:
//             typeof editing.input_schema === "string"
//               ? JSON.parse(editing.input_schema)
//               : editing.input_schema,
//         }),
//       });
//       if (!res.ok) throw new Error(await res.text());
//       await load();
//       setEditing(null);
//     } catch (err) {
//       log("[Skills] save failed:", err);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const remove = async (id: number) => {
//     if (!confirm("Are you sure to delete this Skill?")) return;
//     await fetch(`/api/admin/skills/${id}`, { method: "DELETE" });
//     await load();
//   };

//   return (
//     <AdminDialogShell
//       open={open}
//       onOpenChange={onOpenChange}
//       title="MANAGE SKILLS"
//       toolbar={
//         !editing && (
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={() =>
//               setEditing({
//                 ...EMPTY,
//                 input_schema: JSON.stringify(EMPTY.input_schema, null, 2),
//               })
//             }
//             className="h-8 text-xs text-cyan-300 bg-slate-900/60 border border-cyan-400/30 hover:bg-cyan-500/10"
//           >
//             <Plus className="w-3.5 h-3.5 mr-1" /> NEW
//           </Button>
//         )
//       }
//     >
//       {!editing ? (
//         <AdminTable
//           columns={["Name", "Display", "Type", "Enabled", "Default"]}
//           loading={loading}
//           emptyText="No Skill, click NEW to create one"
//           rows={list.map((s) => ({
//             id: s.id!,
//             cells: [
//               <span key="n" className="font-mono text-cyan-300">
//                 {s.name}
//               </span>,
//               s.display_name ?? "-",
//               <span key="t" className="text-slate-400">
//                 {s.handler_type}
//               </span>,
//               <span
//                 key="e"
//                 className={s.enabled ? "text-emerald-400" : "text-slate-500"}
//               >
//                 {s.enabled ? "ON" : "OFF"}
//               </span>,
//               <span
//                 key="d"
//                 className={s.is_default ? "text-emerald-400" : "text-slate-500"}
//               >
//                 {s.is_default ? "YES" : "NO"}
//               </span>,
//             ],
//           }))}
//           onEdit={(id) => {
//             const s = list.find((x) => x.id === id);
//             if (s)
//               setEditing({
//                 ...s,
//                 input_schema: JSON.stringify(s.input_schema, null, 2),
//               });
//           }}
//           onDelete={remove}
//         />
//       ) : (
//         <div className="space-y-3 max-w-2xl">
//           <button
//             type="button"
//             onClick={() => setEditing(null)}
//             className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
//           >
//             <ArrowLeft className="w-3.5 h-3.5" /> 返回列表
//           </button>

//           <AdminFormField
//             label="Name"
//             value={editing.name}
//             onChange={(v) => setEditing({ ...editing, name: v })}
//           />
//           <AdminFormField
//             label="Display Name"
//             value={editing.display_name}
//             onChange={(v) => setEditing({ ...editing, display_name: v })}
//           />
//           <AdminFormField
//             label="Description"
//             value={editing.description}
//             onChange={(v) => setEditing({ ...editing, description: v })}
//             textarea
//             rows={3}
//           />
//           <AdminFormField
//             label="Handler Type (http/function/mcp)"
//             value={editing.handler_type}
//             onChange={(v) => setEditing({ ...editing, handler_type: v })}
//           />
//           <AdminFormField
//             label="Endpoint"
//             value={editing.endpoint}
//             onChange={(v) => setEditing({ ...editing, endpoint: v })}
//           />
//           <AdminFormField
//             label="Handler Ref"
//             value={editing.handler_ref}
//             onChange={(v) => setEditing({ ...editing, handler_ref: v })}
//           />
//           <AdminFormField
//             label="Input Schema (JSON)"
//             value={
//               typeof editing.input_schema === "string"
//                 ? editing.input_schema
//                 : JSON.stringify(editing.input_schema, null, 2)
//             }
//             onChange={(v) => setEditing({ ...editing, input_schema: v })}
//             textarea
//             rows={8}
//           />

//           <div className="flex gap-4">
//             <label className="flex items-center gap-2 text-xs text-slate-300">
//               <input
//                 type="checkbox"
//                 checked={editing.enabled}
//                 onChange={(e) =>
//                   setEditing({ ...editing, enabled: e.target.checked })
//                 }
//               />
//               Enabled
//             </label>
//             <label className="flex items-center gap-2 text-xs text-slate-300">
//               <input
//                 type="checkbox"
//                 checked={editing.is_default}
//                 onChange={(e) =>
//                   setEditing({ ...editing, is_default: e.target.checked })
//                 }
//               />
//               Default
//             </label>
//           </div>

//           <div className="flex justify-end gap-2 pt-2">
//             <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
//               Cancel
//             </Button>
//             <Button
//               size="sm"
//               onClick={save}
//               disabled={saving}
//               className="bg-cyan-600 hover:bg-cyan-500 text-white"
//             >
//               <Save className="w-3.5 h-3.5 mr-1" />
//               {saving ? "Saving..." : "Save"}
//             </Button>
//           </div>
//         </div>
//       )}
//     </AdminDialogShell>
//   );
// }
