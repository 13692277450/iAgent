// components/RagDetailDialog.tsx
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
"use client";

import { useEffect, useState, useCallback } from "react";
import UploadDropzone from "@/components/assistant-ui/elements/UploadDropzone";

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

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[620px] w-full max-w-4xl flex-col rounded-2xl
                   border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">RAG 数据源</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowUpload((v) => !v)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold
                         text-white transition hover:bg-blue-500"
            >
              {showUpload ? "收起上传" : "＋ 添加 RAG 数据"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm
                         text-slate-300 hover:bg-slate-800"
            >
              关闭
            </button>
          </div>
        </div>

        {/* 安全与权限 */}
        <p className="mt-2 text-xs text-slate-400">
          🔒 安全级别：Internal　|　👥 可见范围：按部门隔离（RLS）　|　 📜
          权限：仅授权部门可检索与引用
        </p>

        {/* 上传区 */}
        {showUpload && (
          <UploadDropzone
            onDone={async () => {
              setShowUpload(false);
              await refresh();
              onChanged();
            }}
          />
        )}

        {/* 列表 */}
        <div className="mt-4 flex-1 overflow-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800 text-slate-300">
              <tr>
                <th className="px-4 py-2 text-left">文档名称</th>
                <th className="px-4 py-2 text-left">类型</th>
                <th className="px-4 py-2 text-left">所属部门</th>
                <th className="px-4 py-2 text-right">分块数</th>
                <th className="px-4 py-2 text-left">入库时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    加载中…
                  </td>
                </tr>
              ) : sources.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    暂无数据，点击「添加 RAG 数据」上传
                  </td>
                </tr>
              ) : (
                sources.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-slate-800 text-slate-200
                               hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-2">{s.title}</td>
                    <td className="px-4 py-2 text-slate-400">
                      {s.docType ?? "-"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {s.departments.map((d) => (
                          <span
                            key={d}
                            className="rounded bg-blue-500/20 px-2 py-0.5
                                       text-xs text-blue-300"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">{s.chunkCount}</td>
                    <td className="px-4 py-2 text-slate-400">{s.ingestedAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
