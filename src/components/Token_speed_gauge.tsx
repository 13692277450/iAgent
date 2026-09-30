"use client";

import { useEffect, useRef, useState } from "react";

export function TokenSpeedGauge({
  value,
  max = 5000,
}: {
  value: number;
  max?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const animRef = useRef<number | null>(null);

  // 平滑过渡到目标值
  useEffect(() => {
    const animate = () => {
      setDisplayValue((prev) => {
        const diff = value - prev;
        if (Math.abs(diff) < 1) return value;
        return prev + diff * 0.2;
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value]);

  // 角度：0 → -120°，max → 120°
  const angle = -120 + (Math.min(displayValue, max) / max) * 240;

  // SVG 圆弧参数
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 70;
  const strokeWidth = 12;

  // 从 -120° 到 120° 的弧线
  const startAngle = -120;
  const endAngle = 120;
  const totalAngle = endAngle - startAngle;

  const polarToCartesian = (angleDeg: number, r: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (start: number, end: number, r: number) => {
    const s = polarToCartesian(end, r);
    const e = polarToCartesian(start, r);
    const largeArc = end - start <= 180 ? 0 : 1;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`;
  };

  const bgArc = describeArc(startAngle, endAngle, radius);
  const valueArc = describeArc(
    startAngle,
    startAngle + (displayValue / max) * totalAngle,
    radius,
  );

  // 指针终点
  const needleEnd = polarToCartesian(angle, radius - 10);

  // 刻度
  const ticks = [0, 1000, 2000, 3000, 4000, 5000];
  const viewBoxValue = `0 0 ${size} ${size}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={viewBoxValue}>
        <title>Token speed gauge</title>
        {/* 背景弧 */}
        <path
          d={bgArc}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-muted/30"
        />

        {/* 值弧 */}
        <path
          d={valueArc}
          fill="none"
          stroke="url(#speedGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* 渐变定义 */}
        <defs>
          <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>

        {/* 刻度线和数字 */}
        {ticks.map((tick) => {
          const tickAngle = startAngle + (tick / max) * totalAngle;
          const outer = polarToCartesian(
            tickAngle,
            radius + strokeWidth / 2 + 4,
          );
          const inner = polarToCartesian(
            tickAngle,
            radius + strokeWidth / 2 + 10,
          );
          const label = polarToCartesian(tickAngle, radius - 20);
          return (
            <g key={tick}>
              <line
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke="currentColor"
                strokeWidth={2}
                className="text-muted-foreground/40"
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[8px]"
              >
                {tick / 1000}k
              </text>
            </g>
          );
        })}

        {/* 指针 */}
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          className="text-cyan-500"
        />

        {/* 中心圆 */}
        <circle cx={cx} cy={cy} r={6} className="fill-cyan-500" />
        <circle cx={cx} cy={cy} r={3} className="fill-background" />
      </svg>

      {/* 数值显示 */}
      <div className="mt-2 text-center">
        <div className="text-2xl font-bold font-mono text-cyan-500">
          {Math.round(displayValue)}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          tokens / sec
        </div>
      </div>
    </div>
  );
}
