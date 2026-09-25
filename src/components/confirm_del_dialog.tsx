"use client";

import { Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  /** 是否是破坏性操作（红色按钮） */
  destructive?: boolean;
  /** 是否正在处理中（显示旋转圈圈，禁用按钮） */
  loading?: boolean;
  /** 处理中显示的文字 */
  loadingText?: string;
};

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "❌ Confirm Delete",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  destructive = false,
  loading = false,
  loadingText = "⏰ Deleting Data in Progress...",
}: ConfirmDialogProps) {
  // 处理中时不允许关闭
  const handleOpenChange = (v: boolean) => {
    if (loading) return;
    onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className="max-w-md bg-slate-950 border border-cyan-400/30 text-slate-100"
        onChange={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-cyan-400">
            {destructive && <AlertTriangle className="size-4 text-red-400" />}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* 加载中：显示旋转圈圈 */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <Loader2 className="size-10 animate-spin text-cyan-400" />
            <p className="text-sm font-medium text-slate-200">{loadingText}</p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            className="border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={
              destructive
                ? "bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                : "bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50"
            }
          >
            {loading ? loadingText : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

{
  /* <ConfirmDialog
  open={!!confirmTarget}
  onOpenChange={(v) => !v && setConfirmTarget(null)}
  title="Confirm Delete"
  description={`确定要删除 MCP Server「${confirmTarget?.name}」吗？`}
  destructive
  loading={deleting}
  loadingText="正在删除..."
  onConfirm={handleConfirmDelete}
/>; */
}
