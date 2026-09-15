// src/hooks/use-logs.ts
"use client";
import { useEffect, useRef, useState } from "react";
import { subscribeLogs, type LogEntry } from "@/lib/logger";

export function useLogs(max = 500) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const maxRef = useRef(max);
  maxRef.current = max;

  useEffect(() => {
    return subscribeLogs((entry) => {
      setLogs((prev) => {
        const next = [...prev, entry];
        return next.length > maxRef.current
          ? next.slice(next.length - maxRef.current)
          : next;
      });
    });
  }, []);

  const clear = () => setLogs([]);
  return { logs, clear };
}