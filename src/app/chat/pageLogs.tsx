"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowDownToLine } from "lucide-react";
import { useLogs } from "@/hooks/use-logs";
import { useI18n } from "@/components/i18n-provider";

const COLOR_MAP: Record<string, string> = {
  cyan: "text-cyan-400 dark:text-cyan-300",
  purple: "text-purple-400 dark:text-purple-300",
  yellow: "text-yellow-500 dark:text-yellow-400",
  red: "text-red-500 dark:text-red-400",
  green: "text-emerald-500 dark:text-emerald-400",
  orange: "text-orange-500 dark:text-orange-400",
  blue: "text-blue-500 dark:text-blue-400",
  slate: "text-slate-600 dark:text-slate-300",
};
const LEVEL_STYLE: Record<string, string> = {
  LOG: "text-slate-600 dark:text-slate-300",
  INFO: "text-cyan-600 dark:text-cyan-300",
  WARN: "text-yellow-600 dark:text-yellow-300",
  ERROR: "text-red-500 dark:text-red-400",
  DEBUG: "text-muted-foreground",
  RAG: "text-cyan-600 dark:text-cyan-400",
  TOOLS: "text-purple-600 dark:text-purple-400",
};

export function LogCard() {
  const { logs, clear } = useLogs(500);
  const { t } = useI18n();
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
    <Card className="glow-card flex h-[560px] flex-col overflow-hidden">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between pb-2">
        <CardTitle className="font-mono text-sm text-cyan-600 dark:text-cyan-400">
          {t("logs.running")}
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
              className="h-7 w-7 text-cyan-600 dark:text-cyan-400 hover:bg-primary/10"
            >
              <ArrowDownToLine className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={clear}
            className="h-7 w-7 text-red-500 dark:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-3 pb-3 font-mono leading-relaxed"
        >
          {logs.length === 0 ? (
            <div className="text-muted-foreground italic">
              {t("logs.waiting")}
            </div>
          ) : (
            logs.map((l) => (
              <div
                key={l.id}
                className="border-b border-border/60 py-1.5 last:border-0"
              >
                {/* 时间：小字、灰色、在上面 */}
                <div className="mb-0.5 font-mono text-[10px] text-primary/70">
                  {l.time}
                </div>

                {/* 内容：正常字号、按级别着色、在下面，从行首开始 */}
                <div
                  className={`whitespace-pre-wrap break-all text-[12px] ${
                    l.color
                      ? (COLOR_MAP[l.color] ??
                        LEVEL_STYLE[l.level] ??
                        "text-slate-600 dark:text-slate-300")
                      : (LEVEL_STYLE[l.level] ?? "text-slate-600 dark:text-slate-300")
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