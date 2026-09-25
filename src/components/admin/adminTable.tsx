/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
"use client";

import { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export function AdminTable({
  columns,
  rows,
  loading,
  emptyText,
  onEdit,
  onDelete,
}: {
  columns: string[];
  rows: Array<{ id: number; cells: ReactNode[] }>;
  loading?: boolean;
  emptyText?: ReactNode;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-muted text-foreground">
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                className="px-4 py-2 text-left font-mono text-xs text-cyan-600 dark:text-cyan-400"
              >
                {c}
              </th>
            ))}
            <th className="w-32 px-4 py-2 text-right font-mono text-xs text-cyan-600 dark:text-cyan-400">
              {t("common.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-6 text-center text-muted-foreground"
              >
                {t("common.loading")}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-6 text-center text-muted-foreground"
              >
                {emptyText ?? t("admin.noData")}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-border text-foreground transition-colors hover:bg-primary/5"
              >
                {r.cells.map((cell, i) => (
                  <td key={i} className="px-4 py-2">
                    {cell}
                  </td>
                ))}
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(r.id)}
                      className="rounded p-1.5 text-cyan-600/70 transition-colors hover:bg-cyan-500/10 hover:text-cyan-600 dark:text-cyan-400/70 dark:hover:text-cyan-300"
                      title={t("common.edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(r.id)}
                      className="rounded p-1.5 text-red-500/60 transition-colors hover:bg-red-500/10 hover:text-red-500"
                      title={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
