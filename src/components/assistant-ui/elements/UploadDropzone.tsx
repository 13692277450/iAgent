// components/UploadDropzone.tsx
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
"use client";

import { useRef, useState } from "react";

export default function UploadDropzone({ onDone }: { onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [departments, setDepartments] = useState("HR");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function pickFiles(list: FileList | null) {
    if (!list) return;
    setFiles(Array.from(list));
  }

  async function handleUpload() {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    const form = new FormData();
    files.forEach((f) => void form.append("files", f));
    form.append("departments", departments);

    try {
      // 用 XMLHttpRequest 拿上传进度
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/rag/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () =>
          xhr.status < 400 ? resolve() : reject(xhr.responseText);
        xhr.onerror = () => reject("网络错误");
        xhr.send(form);
      });
      onDone();
    } catch (e) {
      setError(typeof e === "string" ? e : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-600 bg-slate-800/50 p-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pickFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-lg border border-slate-700 bg-slate-900/50
                   p-6 text-center text-sm text-slate-400 hover:border-blue-500"
      >
        拖拽文件到此处，或点击选择（支持多文件）
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept=".txt,.md,.pdf,.docx"
          onChange={(e) => pickFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 max-h-32 space-y-1 overflow-auto text-xs text-slate-300">
          {files.map((f) => (
            <li key={f.name} className="flex justify-between">
              <span className="truncate">{f.name}</span>
              <span className="text-slate-500">
                {(f.size / 1024).toFixed(0)} KB
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-3">
        <label className="text-xs text-slate-400">所属部门：</label>
        <input
          value={departments}
          onChange={(e) => setDepartments(e.target.value)}
          placeholder="HR,LEGAL"
          className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm
                     text-slate-200 outline-none focus:border-blue-500"
        />
        <button
          type="button"
          disabled={!files.length || uploading}
          onClick={handleUpload}
          className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold
                     text-white transition hover:bg-blue-500
                     disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          {uploading ? `上传中 ${progress}%` : "开始上传"}
        </button>
      </div>

      {uploading && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
