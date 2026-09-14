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
    <div className="space-y-4">
      {/* 汇总数字 */}
      <div className="text-sm text-slate-500 space-y-1">
        <div>
          Token Usage Total In This Month:{" "}
          <span className="font-bold text-orange-700">
            {loading ? "loading..." : monthTotal.toLocaleString()}
          </span>
        </div>
        <div className="text-blue-500">
          Yearly Token Usage Total:{" "}
          <span className="text-orange-700 font-bold">
            {loading ? "loading..." : yearTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 日历 */}
      <div className="p-3 bg-blue-50 rounded-md text-blue-700">
        📊
        <div className="overflow-visible mt-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="w-full rounded-lg border"
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
                        {usage >= 1000
                          ? `${(usage / 1000).toFixed(1)}k`
                          : usage}
                      </span>
                    )}
                  </CalendarDayButton>
                );
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
