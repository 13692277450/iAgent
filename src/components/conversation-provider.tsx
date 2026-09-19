// src/components/conversation-provider.tsx
"use client";
import { createContext, useContext, useState, useCallback } from "react";

type ConversationContextValue = {
  refreshTick: number; // 变化时触发列表重新拉
  triggerRefresh: () => void; // 保存后调
  restoreId: number | null; // 要恢复的会话 id
  requestRestore: (id: number) => void;
  clearRestore: () => void;
};

const ConversationContext = createContext<ConversationContextValue | null>(
  null,
);
const ConversationContextProvider = ConversationContext.Provider;

export function ConversationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [refreshTick, setRefreshTick] = useState(0);
  const [restoreId, setRestoreId] = useState<number | null>(null);

  const triggerRefresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  const requestRestore = useCallback((id: number) => {
    setRestoreId(id);
  }, []);

  const clearRestore = useCallback(() => {
    setRestoreId(null);
  }, []);

  return (
    <ConversationContextProvider
      value={{
        refreshTick,
        triggerRefresh,
        restoreId,
        requestRestore,
        clearRestore,
      }}
    >
      {children}
    </ConversationContextProvider>
  );
}

export function useConversation() {
  const ctx = useContext(ConversationContext);
  if (!ctx)
    throw new Error(
      "useConversation must be used within <ConversationProvider>",
    );
  return ctx;
}
