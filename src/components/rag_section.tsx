"use client";

import { useEffect, useState, useCallback } from "react";
import RagCard from "@/components/rag_card";
import { useConversation } from "@/components/conversation-provider";

export default function RagSection() {
  const [count, setCount] = useState(0);
  const { triggerRefresh } = useConversation();

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/rag/sources", { cache: "no-store" });
      const data = await res.json();
      setCount(data.sources?.length ?? 0);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // 上传完成后：既刷新卡片数量，也刷新对话历史
  const handleRefresh = useCallback(async () => {
    await fetchCount();
    triggerRefresh?.();
  }, [fetchCount, triggerRefresh]);

  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-blue-600">MCP SERVERS</h3>
      <div className="flex flex-wrap gap-4">
        <RagCard
          name="RAG Server"
          status="online"
          sourceCount={count}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
