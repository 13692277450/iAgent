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
          className="w-full bg-transparent text-slate-100"
          classNames={{
            months: "flex flex-col",
            month: "space-y-4",
            month_caption: "flex justify-center pt-1 relative items-center",
            caption_label:
              "text-base font-mono text-cyan-300 tracking-wide font-semibold",
            nav: "space-x-2 flex items-center",
            button_previous:
              "h-8 w-8 bg-transparent p-0 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 rounded-md transition-colors absolute left-1",
            button_next:
              "h-8 w-8 bg-transparent p-0 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 rounded-md transition-colors absolute right-1",
            month_grid: "w-full border-collapse",
            weekdays: "flex",
            weekday:
              "text-slate-400 rounded-md w-11 font-mono text-xs uppercase font-semibold",
            week: "flex w-full mt-1",
            day: "h-11 w-11 text-center text-sm p-0 relative",
            day_button:
              "h-11 w-11 p-0 font-normal text-slate-100 hover:bg-cyan-500/15 hover:text-cyan-100 rounded-md transition-colors",
            selected:
              "bg-white text-slate-900 font-semibold border-2 border-white hover:bg-slate-100",
            today:
              "bg-slate-800 text-cyan-200 font-semibold border border-cyan-400/40",
            outside: "text-slate-500 opacity-50",
            disabled: "text-slate-600 opacity-30",
            hidden: "invisible",
          }}
          components={{
            DayButton: (props) => {
              const usage = getTokenForDate(props.day.date);
              return (
                <CalendarDayButton
                  {...props}
                  className="
            !h-11 !w-11
            group
            hover:bg-cyan-500/15
            data-[selected=true]:bg-white
            data-[selected=true]:text-slate-900
            data-[selected=true]:border-2
            data-[selected=true]:border-white
            data-[selected=true]:font-semibold
            rounded-md transition-colors
            flex flex-col items-center justify-center gap-0.5
          "
                >
                  <span className="text-base leading-none font-medium">
                    {props.children}
                  </span>
                  {usage !== undefined && (
                    <span className="text-xs leading-none font-semibold font-mono text-cyan-300 group-data-[selected=true]:text-slate-700">
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
