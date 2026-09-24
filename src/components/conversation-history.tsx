"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { useConversation } from "@/components/conversation-provider";
import { log } from "@/lib/logger";

export function ConversationHistory() {
  const [list, setList] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { refreshTick, requestRestore, triggerRefresh } = useConversation();

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
        console.error("[history] 拉取失败:", err);
      });

    return () => controller.abort();
  }, [refreshTick]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, id: number) => {
      e.stopPropagation(); // 阻止触发父元素的 restore
      if (!confirm("Are you sure you want to delete this conversation?"))
        return;

      setDeletingId(id);
      try {
        const res = await fetch(`/api/conversation/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Delete failed");
        triggerRefresh(); // 自动刷新列表
        console.log("Delete success:", id);
        log("[HISTORY] Delete success:", id);
      } catch (err) {
        console.error("[HISTORY] Delete failed:", err);
      } finally {
        setDeletingId(null);
      }
    },
    [triggerRefresh],
  );

  // 新会话
  const handleNewChat = () => {
    requestRestore(0); // Trigger restore with restoreId = 0
    // setConversationId(null);
  };
  return (
    <Card className="bg-slate-950 border border-cyan-400/30 h-[300px] overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-cyan-400 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            CONVERSATIONS
          </span>
          <button
            type="button"
            onClick={() => handleNewChat()}
            className="text-cyan-300 hover:text-cyan-100 size-4"
            title="New Conversation"
          >
            <Plus className="w-6 h-6 font-bold" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
        {list.length === 0 ? (
          <div className="text-xs text-slate-500 italic p-2">
            No conversations found
          </div>
        ) : (
          list.map((c) => (
            <div
              key={c.id}
              className="group flex items-center gap-1 rounded-md border border-transparent hover:border-cyan-400/30 transition-colors"
            >
              <button
                type="button"
                title="Double click to restore this conversation"
                onClick={() => requestRestore(c.id)}
                className="flex-1 text-left px-2 py-1.5 rounded-md text-xs text-slate-200 hover:bg-cyan-500/30 transition-colors min-w-0"
              >
                <div className="truncate">{c.title}</div>
                <div className="text-[10px] text-slate-500">
                  {c.message_count} messages ·{" "}
                  {new Date(c.updated_at).toLocaleDateString()}
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => handleDelete(e, c.id)}
                disabled={deletingId === c.id}
                className="flex-shrink-0 p-1 mr-1 rounded opacity-50 group-hover:opacity-100 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30"
                title="Delete this conversation"
              >
                <Trash2 className="w-4 h-4.5" />
              </button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
