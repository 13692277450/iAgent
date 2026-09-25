/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
"use client";

import { useRef, useState } from "react";
import { DepartmentSelect } from "@/components/admin/departmentSelect";
import { X, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

type ProgressEvent = {
  type: "progress" | "done" | "error";
  step?: "parse" | "chunk" | "chunk-done" | "embed" | "insert" | "file-done";
  file?: string;
  fileIndex?: number;
  total?: number;
  chunks?: number;
  message: string;
};

type FileItem = {
  id: string;
  file: File;
  departments: string[];
};

export default function UploadDropzone({
  onDone,
  onUploaded, // 👈 新增：上传完成时通知外层刷新列表（不关闭上传区）
}: {
  onDone: () => void;
  onUploaded?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [finished, setFinished] = useState(false); // 👈 新增：是否已完成
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const { t } = useI18n();

  function pickFiles(list: FileList | null) {
    if (!list) return;
    const newItems: FileItem[] = Array.from(list).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      departments: [],
    }));
    setItems((prev) => [...prev, ...newItems]);
    setEvents([]);
    setFinished(false);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function setItemDepartments(id: string, departments: string[]) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, departments } : it)),
    );
  }

  async function handleUpload() {
    if (items.length === 0) return;

    const missing = items.filter((it) => it.departments.length === 0);
    if (missing.length > 0) {
      setError(
        t("upload.missingDepartments", {
          files: missing.map((m) => m.file.name).join(", "),
        }),
      );
      return;
    }

    setUploading(true);
    setFinished(false);
    setError(null);
    setProgress(0);
    setEvents([]);

    const form = new FormData();
    items.forEach((it, i) => {
      form.append("files", it.file);
      form.append(`departments_${i}`, it.departments.join(","));
    });
    form.append("departments", items[0]?.departments.join(",") ?? "");

    try {
      const res = await fetch("/api/rag/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const event: ProgressEvent = JSON.parse(line.slice(6));
            setEvents((prev) => [...prev, event]);

            if (event.type === "progress" && event.total && event.fileIndex) {
              const fileProgress =
                event.step === "parse"
                  ? 0.1
                  : event.step === "chunk"
                    ? 0.3
                    : event.step === "chunk-done"
                      ? 0.4
                      : event.step === "embed"
                        ? 0.6
                        : event.step === "insert"
                          ? 0.8
                          : event.step === "file-done"
                            ? 1
                            : 0;
              const overall =
                (event.fileIndex - 1 + fileProgress) / event.total;
              setProgress(Math.round(overall * 100));
            }

            if (event.type === "done") {
              setProgress(100);
              setFinished(true);
              // 👇 不调 onDone()，只通知外层刷新列表
              onUploaded?.();
            }

            if (event.type === "error") {
              setError(event.message);
            }
          } catch {
            // 忽略
          }
        }
      }
    } catch (e: any) {
      setError(e.message ?? t("upload.failed"));
    } finally {
      setUploading(false);
    }
  }

  // 👇 重置，准备上传下一批
  function handleReset() {
    setItems([]);
    setEvents([]);
    setProgress(0);
    setFinished(false);
    setError(null);
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/40 p-4">
      {/* 拖拽区：完成后隐藏 */}
      {!finished && (
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pickFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className="cursor-pointer rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground hover:border-blue-500 focus:outline-none focus:border-blue-500"
        >
          {t("upload.dropHint")}
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept=".txt,.md,.pdf,.docx"
            onChange={(e) => pickFiles(e.target.files)}
          />
        </div>
      )}

      {/* 文件列表：完成后隐藏 */}
      {!finished && items.length > 0 && (
        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {items.map((it) => (
            <div
              key={it.id}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-foreground truncate flex-1">
                  📄 {it.file.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(it.file.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  disabled={uploading}
                  className="p-1 rounded text-red-500/60 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 shrink-0"
                  aria-label={t("upload.removeFile", { name: it.file.name })}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground pt-1 shrink-0">
                  {t("upload.departments")}
                </span>
                <div className="flex-1">
                  <DepartmentSelect
                    value={it.departments}
                    onChange={(v) => setItemDepartments(it.id, v)}
                    multiple
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮：完成后隐藏 */}
      {!finished && items.length > 0 && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={uploading}
            onClick={handleUpload}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            {uploading
              ? t("upload.progress", { progress })
              : t("upload.start", { count: items.length })}
          </button>
        </div>
      )}

      {/* 总进度条 */}
      {uploading && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 错误 */}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {/* 进度窗口：始终保留 */}
      {events.length > 0 && (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-blue-500/30 bg-card p-3 font-mono text-xs">
          {events.map((ev, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 py-0.5 ${
                ev.type === "error"
                  ? "text-red-400"
                  : ev.type === "done"
                    ? "text-emerald-400"
                    : ev.step === "file-done"
                      ? "text-cyan-300"
                      : "text-foreground"
              }`}
            >
              <span className="shrink-0">
                {ev.type === "error"
                  ? "✗"
                  : ev.type === "done"
                    ? "✓"
                    : ev.step === "file-done"
                      ? "✓"
                      : "▸"}
              </span>
              <span>
                {ev.total && ev.fileIndex && `[${ev.fileIndex}/${ev.total}] `}
                {ev.message}
                {ev.chunks !== undefined &&
                  ` · ${t("upload.chunksCount", { count: ev.chunks })}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 👇 完成后的操作按钮 */}
      {finished && (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-emerald-500/20 pt-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {t("upload.complete", { count: items.length })}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              {t("upload.continue")}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
