// components/RagDetailDialog.tsx
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
"use client";

import { useEffect, useState, useCallback } from "react";
import UploadDropzone from "@/components/assistant-ui/elements/UploadDropzone";
import { Trash2, X, Upload } from "lucide-react";
import { useI18n } from "./i18n-provider";

type Source = {
  id: number;
  title: string;
  docType: string | null;
  departments: string[];
  chunkCount: number;
  securityLevel: string;
  ingestedAt: string;
};

export default function RAGDetailDialog({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: () => void;
}) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { t } = useI18n();

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/rag/sources", { cache: "no-store" });
    const data = await res.json();
    setSources(data.sources ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = useCallback(
    async (id: number, title: string) => {
      if (!confirm(t("rag.deleteConfirmSource", { title }))) {
        return;
      }
      setDeletingId(id);
      try {
        const res = await fetch(`/api/rag/sources/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        await refresh();
        onChanged();
      } catch (err) {
        console.error("[RAG] delete failed:", err);
        alert(t("rag.deleteFailed") + "：" + (err as Error).message);
      } finally {
        setDeletingId(null);
      }
    },
    [refresh, onChanged, t],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glow-card flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部 */}
        <div className="flex shrink-0 items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {t("rag.detail")}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowUpload((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                showUpload
                  ? "bg-muted-foreground hover:bg-muted-foreground/80"
                  : "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500"
              }`}
            >
              <Upload className="size-4" />
              {showUpload ? t("rag.collapseUploads") : t("rag.addData")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted"
              aria-label={t("common.close")}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* 安全与权限 */}
        <p className="mt-2 shrink-0 text-xs text-muted-foreground">
          {t("ragNotice.security")}
        </p>

        {/* 上传区：独立滚动，最大高度限制 */}
        {showUpload && (
          <div className="mt-4 max-h-[45vh] shrink-0 overflow-y-auto rounded-xl border border-primary/20 bg-muted/50 p-1 custom-scrollbar">
            <UploadDropzone
              onDone={() => setShowUpload(false)}
              onUploaded={async () => {
                await refresh();
                onChanged();
              }}
            />
          </div>
        )}
{/* 数据列表：占剩余空间 */}
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="mb-2 flex shrink-0 items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t("common.total")} {sources.length} {t("common.dataSources")}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted text-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-mono text-xs text-cyan-600 dark:text-cyan-400">
                    {t("rag.docTitle")}
                  </th>
                  <th className="px-4 py-2 text-left font-mono text-xs text-cyan-600 dark:text-cyan-400">
                    {t("rag.docType")}
                  </th>
                  <th className="px-4 py-2 text-left font-mono text-xs text-cyan-600 dark:text-cyan-400">
                    {t("rag.departments")}
                  </th>
                  <th className="px-4 py-2 text-right font-mono text-xs text-cyan-600 dark:text-cyan-400">
                    {t("rag.chunkCount")}
                  </th>
                  <th className="px-4 py-2 text-left font-mono text-xs text-cyan-600 dark:text-cyan-400">
                    {t("rag.uploadTime")}
                  </th>
                  <th className="px-4 py-2 text-right font-mono text-xs text-cyan-600 dark:text-cyan-400">
                    {t("rag.action")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      {t("common.loading")}
                    </td>
                  </tr>
                ) : sources.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      {t("rag.noData")}
                    </td>
                  </tr>
                ) : (
                  sources.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-border text-foreground transition-colors hover:bg-muted/60"
                    >
                      <td className="px-4 py-2">{s.title}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {s.docType ?? "-"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {s.departments.map((d) => (
                            <span
                              key={d}
                              className="rounded bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-700 dark:text-cyan-300"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">{s.chunkCount}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {s.ingestedAt}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id, s.title)}
                          disabled={deletingId === s.id}
                          className="rounded p-1.5 text-red-500/60 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-30"
                          title={t("rag.deleteTitle")}
                          aria-label={`${t("rag.deleteTitle")} ${s.title}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}