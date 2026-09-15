// src/components/mcp-provider.tsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export type McpServer = {
  id: number;
  name: string;
  description: string | null;
  connection_type: string;
  connection_api: string;
  auth_type: string;
  auth_config: string;
  status: string;
  last_error: string | null;
  permission: string;
  enabled: boolean;
  tools: unknown;
  created_at: Date;
};

type McpContextValue = {
  servers: McpServer[]; // 所有 server
  selected: McpServer[]; // 已选中的
  toggle: (server: McpServer) => void; // 勾选/取消
  isSelected: (id: number) => boolean;
  cleanAll: () => void; // 清空
  loading: boolean;
};

const McpContext = createContext<McpContextValue | null>(null);
const McpContextProvider = McpContext.Provider;

export function McpProvider({ children }: { children: React.ReactNode }) {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [selected, setSelected] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);

  // 拉取所有 server
  useEffect(() => {
    let cancelled = false;
    fetch("/api/mcp")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setServers(d.servers ?? []);
      })
      .catch((err) => console.error("Failed to fetch mcp servers", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 🚨 关键：按 id 去重，避免重复选中
  const toggle = useCallback((server: McpServer) => {
    setSelected((prev) => {
      const exists = prev.some((s) => s.id === server.id);
      if (exists) {
        return prev.filter((s) => s.id !== server.id); // 取消
      }
      return [...prev, server]; // 添加
    });
  }, []);

  const isSelected = useCallback(
    (id: number) => selected.some((s) => s.id === id),
    [selected],
  );

  const cleanAll = useCallback(() => setSelected([]), []);

  return (
    <McpContextProvider
      value={{ servers, selected, toggle, isSelected, cleanAll, loading }}
    >
      {children}
    </McpContextProvider>
  );
}

export function useMcp() {
  const ctx = useContext(McpContext);
  if (!ctx) throw new Error("useMcp must be used within <McpProvider>");
  return ctx;
}
