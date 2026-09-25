// src/components/token-calendar-content.tsx
"use client";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { useI18n } from "@/components/i18n-provider";

export function TokenCalendarContent() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tokenMap, setTokenMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/token", { signal: controller.signal });
        const data = await res.json();
        if (!cancelled) {
          setTokenMap(data.usage || {});
        }
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        console.error("Failed to fetch token usage", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // 用本地时间格式化，避免 toISOString 的时区偏移
  const getTokenForDate = (d: Date): number | undefined => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return tokenMap[`${y}-${m}-${day}`];
  };

  const ref = date || new Date();

  const monthTotal = Object.entries(tokenMap)
    .filter(([k]) => {
      const [y, m] = k.split("-").map(Number);
      return y === ref.getFullYear() && m === ref.getMonth() + 1;
    })
    .reduce((sum, [, v]) => sum + v, 0);

  const yearTotal = Object.entries(tokenMap)
    .filter(([k]) => {
      const [y] = k.split("-").map(Number);
      return y === ref.getFullYear();
    })
    .reduce((sum, [, v]) => sum + v, 0);
  const [month, setMonth] = useState<Date>(new Date());

  return (
    <div className="space-y-5">
      {/* 汇总数字 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-primary/40 bg-card px-4 py-3">
          <div className="font-mono text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            {t("token.thisMonth")}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {loading ? t("token.loading") : monthTotal.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-primary/40 bg-card px-4 py-3">
          <div className="font-mono text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            {t("token.thisYear")}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {loading ? t("token.loading") : yearTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 日历容器 */}
      <div className="overflow-hidden rounded-lg border border-border bg-card/60 p-4 text-cyan-600 dark:text-cyan-400">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)} // 2020年1月
          endMonth={new Date(2030, 11)} // 2030年12月
          className="w-full rounded-lg border border-border bg-card text-foreground"
          components={{
            DayButton: (props) => {
              const usage = getTokenForDate(props.day.date);
              return (
                <CalendarDayButton
                  {...props}
                  className="rounded-md transition-colors hover:bg-primary/15 data-[selected=true]:bg-primary/25 data-[selected=true]:text-cyan-700 dark:data-[selected=true]:text-cyan-300 data-[selected=true]:border-primary/50"
                >
                  <span>{props.children}</span>
                  {usage !== undefined && (
                    <span className="text-[14px] font-semibold leading-none text-orange-600 dark:text-orange-400">
                      {usage >= 1000
                        ? `Total: ${(usage / 1000).toFixed(1)}k`
                        : `Total: ${usage}`}
                    </span>
                  )}
                </CalendarDayButton>
              );
            },
          }}
        />
      </div>
    </div>
  );
}
