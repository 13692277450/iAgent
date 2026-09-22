"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowDownToLine } from "lucide-react";
import { useLogs } from "@/hooks/use-logs";

const COLOR_MAP: Record<string, string> = {
  cyan: "text-cyan-400",
  purple: "text-purple-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
  green: "text-emerald-400",
  orange: "text-orange-400",
  blue: "text-blue-400",
  slate: "text-slate-200",
};
const LEVEL_STYLE: Record<string, string> = {
  LOG: "text-slate-200",
  INFO: "text-cyan-300",
  WARN: "text-yellow-300",
  ERROR: "text-red-400",
  DEBUG: "text-slate-400",
  RAG: "text-cyan-400",
  TOOLS: "text-purple-400",
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
    <Card className="bg-slate-950 border border-cyan-400/30 flex flex-col overflow-hidden h-[600px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <CardTitle className="text-sm font-mono text-cyan-400">
          📊 RUNNING LOGS
        </CardTitle>
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
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-3 pb-3 font-mono leading-relaxed"
        >
          {logs.length === 0 ? (
            <div className="text-slate-500 italic">Waiting for logs…</div>
          ) : (
            logs.map((l) => (
              <div
                key={l.id}
                className="py-1.5 border-b border-cyan-400/5 last:border-0"
              >
                {/* 时间：小字、灰色、在上面 */}
                <div className="text-[10px] text-cyan-500 font-mono mb-0.5">
                  {l.time}
                </div>

                {/* 内容：正常字号、按级别着色、在下面，从行首开始 */}
                {/* <div
                  className={`whitespace-pre-wrap break-all text-[12px] ${
                    LEVEL_STYLE[l.level] ?? "text-slate-200"
                  }`}
                >
                  {l.text}
                </div> */}
                <div
                  className={`whitespace-pre-wrap break-all text-[12px] ${
                    l.color
                      ? (COLOR_MAP[l.color] ??
                        LEVEL_STYLE[l.level] ??
                        "text-slate-200")
                      : (LEVEL_STYLE[l.level] ?? "text-slate-200")
                  }`}
                >
                  {l.text}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
