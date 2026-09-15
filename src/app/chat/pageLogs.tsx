"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowDownToLine } from "lucide-react";
import { useLogs } from "@/hooks/use-logs";

const LEVEL_STYLE: Record<string, string> = {
  log: "text-slate-200",
  info: "text-cyan-300",
  warn: "text-yellow-300",
  error: "text-red-400",
  debug: "text-slate-400",
};

export function LogCard() {
  const { logs, clear } = useLogs(500);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    // 读一下 logs.length，让依赖成立
    void logs.length;
  }, [logs, autoScroll]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    setAutoScroll(atBottom);
  };

  return (
    <Card className="bg-slate-950 border border-cyan-400/30 flex flex-col overflow-hidden h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <CardTitle className="text-sm font-mono text-cyan-400">LOG</CardTitle>
        <div className="flex items-center gap-1">
          {!autoScroll && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setAutoScroll(true);
                const el = scrollRef.current;
                if (el) el.scrollTop = el.scrollHeight;
              }}
              className="h-7 w-7 text-cyan-400 hover:bg-cyan-500/10"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={clear}
            className="h-7 w-7 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>

      {/* ✅ CardContent：只占剩余空间，不滚动，不 h-full */}
      <CardContent className="flex-1 min-h-0 p-0">
        {/* ✅ 唯一滚动容器 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-3 pb-3 font-mono text-[12px] leading-relaxed"
        >
          {logs.length === 0 ? (
            <div className="text-slate-500 italic">Waiting for logs…</div>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="flex gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">{l.time}</span>
                <span
                  className={`whitespace-pre-wrap break-all ${LEVEL_STYLE[l.level] ?? "text-slate-200"}`}
                >
                  {l.text}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
