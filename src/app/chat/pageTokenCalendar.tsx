"use client";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function PageTokenCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  // 日期字符串(YYYY-MM-DD) -> token 使用量
  const [tokenMap, setTokenMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/token");
        const data = await res.json();
        if (!cancelled) {
          setTokenMap(data.usage || {});
        }
      } catch (err) {
        console.error("Failed to fetch token usage", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 把 Date 格式化为 YYYY-MM-DD 去 tokenMap 里查值   &&&&&& 会退后一天因为时区问题。
  //   const getTokenForDate = (d: Date): number | undefined => {
  //     const key = d.toISOString().slice(0, 10);
  //     return tokenMap[key];
  //   };

  const getTokenForDate = (d: Date): number | undefined => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;
    // console.log("date key:", key, "value:", tokenMap[key]);
    return tokenMap[key];
  };

  // 计算当月 token 合计
  const monthTotal = Object.entries(tokenMap)
    .filter(([k]) => {
      const [y, m] = k.split("-").map(Number);
      const ref = date || new Date();
      return y === ref.getFullYear() && m === ref.getMonth() + 1;
    })
    .reduce((sum, [, v]) => sum + v, 0);

  // 计算当年 token 合计
  const yearTotal = Object.entries(tokenMap)
    .filter(([k]) => {
      const [y, m] = k.split("-").map(Number);
      const ref = date || new Date();
      return y === ref.getFullYear();
    })
    .reduce((sum, [, v]) => sum + v, 0);

  return (
    <div>
      <Card className="bg-white shadow-none border-none max-w-[650px] align-middle">
        <CardHeader>
          <CardTitle className="text-lg">TOKEN INFORMATION</CardTitle>
          <div className="text-md text-slate-500">
            Token Usage Total In This Month:{" "}
            <span className="font-bold text-orange-700">
              {loading ? "loading..." : monthTotal.toLocaleString()}
            </span>
            <div className="text-md text-blue-500">
              Yearly Token Usage Total:{" "}
              <span className="text-orange-700 font-bold">
                {loading ? "loading..." : yearTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-lg text-slate-500">
          <div className="mt-4 p-3 bg-blue-50 rounded-md text-blue-700 max-w-[600px] !text-lg">
            📊
            <div className="overflow-visible">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full rounded-lg border .\!text-base { font-size: 1rem !important; }"
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
                          <span className="text-[14px] !text-md leading-none text-orange-600 font-semibold">
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
        </CardContent>
      </Card>
    </div>
  );
}
