// src/components/token-calendar-content.tsx
"use client";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { useState, useEffect } from "react";

export function TokenCalendarContent() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tokenMap, setTokenMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

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
        <div className="rounded-lg border border-cyan-400/40 bg-slate-900 px-4 py-3">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            THIS MONTH
          </div>
          <div className="text-2xl font-bold text-cyan-200 tabular-nums mt-1">
            {loading ? "Loading..." : monthTotal.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-cyan-400/40 bg-slate-900 px-4 py-3">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            THIS YEAR
          </div>
          <div className="text-2xl font-bold text-cyan-200 tabular-nums mt-1">
            {loading ? "Loading" : yearTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 日历容器 */}
      <div className="p-4 rounded-lg border border-cyan-400/30 bg-slate-900 overflow-hidden">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)} // 2020年1月
          endMonth={new Date(2030, 11)} // 2030年12月
          className="w-full rounded-lg border text-base"
          components={{
            DayButton: (props) => {
              const usage = getTokenForDate(props.day.date);
              return (
                <CalendarDayButton
                  {...props}
                  className="hover:bg-orange-200/60 data-[selected=true]:bg-cyan-500/30 data-[selected=true]:text-cyan-400/60 data-[selected=true]:border-cyan-400/50 rounded-md transition-colors"
                >
                  <span>{props.children}</span>
                  {usage !== undefined && (
                    <span className="text-[14px] leading-none text-orange-600 font-semibold">
                      {usage >= 1000 ? `${(usage / 1000).toFixed(1)}k` : usage}
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
