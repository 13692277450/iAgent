"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageSquare, Plus, Trash2, Loader2 } from "lucide-react";
import { useConversation } from "@/components/conversation-provider";
import { useI18n } from "@/components/i18n-provider";
import { log } from "@/lib/logger";
import { ConfirmDialog } from "./assistant-ui/elements/confirm_dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function ConversationHistory() {
  const [list, setList] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  // 👇 新增：是否正在删除
  const [deleting, setDeleting] = useState(false);

  const { refreshTick, requestRestore, triggerRefresh } = useConversation();
  const { t } = useI18n();

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/conversation/list?t=${refreshTick}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => setList(d.conversations ?? []))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("[history] Pull conversation list failed:", err);
      });

    return () => controller.abort();
  }, [refreshTick]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, id: number, title: string) => {
      e.stopPropagation();
      setConfirmTarget({ id, title });
    },
    [],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmTarget) return;
    const id = confirmTarget.id;

    // 👇 关闭确认框，打开加载框
    setConfirmTarget(null);
    setDeleting(true);
    setDeletingId(id);

    try {
      const res = await fetch(`/api/conversation/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      triggerRefresh();
      log("[HISTORY] Conversation deleted success:", id);
    } catch (err) {
      console.error("[HISTORY] Conversation delete failed:", err);
    } finally {
      // 👇 关闭加载框
      setDeleting(false);
      setDeletingId(null);
    }
  }, [confirmTarget, triggerRefresh]);

  const handleNewChat = () => {
    requestRestore(0);
  };

  return (
    <>
      <Card className="glow-card h-[300px] flex flex-col overflow-hidden">
        <CardHeader className="shrink-0 pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-semibold text-cyan-600 dark:text-cyan-400">
            <span className="flex items-center gap-2">
              <MessageSquare className="size-4" />
              {t("sidebar.conversations")}
            </span>
            <button
              type="button"
              onClick={() => handleNewChat()}
              className="inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-cyan-500/10 hover:text-cyan-500"
              title={t("sidebar.newConversationTitle")}
            >
              <Plus className="size-4 font-bold" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2 custom-scrollbar">
          {list.length === 0 ? (
            <div className="p-2 text-xs text-muted-foreground italic">
              {t("sidebar.noConversations")}
            </div>
          ) : (
            list.map((c) => (
              <div
                key={c.id}
                className="group flex items-center gap-1 rounded-md border border-transparent transition-colors hover:border-primary/30"
              >
                <button
                  type="button"
                  title={t("sidebar.restoreTitle")}
                  onClick={() => requestRestore(c.id)}
                  className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-primary/10"
                >
                  <div className="truncate">{c.title}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {c.message_count} {t("sidebar.messages")} ·{" "}
                    {new Date(c.updated_at).toLocaleDateString()}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteClick(e, c.id, c.title)}
                  disabled={deletingId === c.id}
                  className="mr-1 flex-shrink-0 rounded p-1 text-red-400/60 opacity-50 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-30"
                  title={t("common.delete")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 确认弹窗 */}
      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(v) => !v && setConfirmTarget(null)}
        title={t("❌ Confirm Delete")}
        description={
          confirmTarget
            ? `${t("Are you sure you want to delete?")} 「${confirmTarget.title}」`
            : ""
        }
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        destructive
        onConfirm={handleConfirmDelete}
      />

      {/* 👇 删除中加载弹窗 */}
      <Dialog open={deleting} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-xs bg-slate-950 border border-cyan-400/30 text-slate-100"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="sr-only">
              {t("❌ Data Deleting...")}
            </DialogTitle>
            <DialogDescription className="sr-only">{t("")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-6">
            <Loader2 className="size-10 animate-spin text-cyan-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-100">
                {t("⏰ Data deleting in progress, pls wait...")}
              </p>
              <p className="mt-1 text-xs text-slate-400">{t("")}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
