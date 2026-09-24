/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
"use client";

import { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";

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
  return (
    <div className="rounded-xl border border-cyan-400/20 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-900 text-slate-300 z-10">
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                className="px-4 py-2 text-left font-mono text-xs text-cyan-400"
              >
                {c}
              </th>
            ))}
            <th className="px-4 py-2 text-right font-mono text-xs text-cyan-400 w-32">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-6 text-center text-slate-500"
              >
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-6 text-center text-slate-500"
              >
                {emptyText ?? "No data available"}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-slate-800 text-slate-200 hover:bg-cyan-500/5 transition-colors"
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
                      className="p-1.5 rounded text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(r.id)}
                      className="p-1.5 rounded text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
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
