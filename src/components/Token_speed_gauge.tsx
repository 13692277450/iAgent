export function TokenSpeedGauge({
  value,
  samples,
  average,
  max = 5000,
}: {
  value: number;
  samples: number[];
  average: number;
  max?: number;
}) {
  const width = 320;
  const height = 156;
  const left = 34;
  const right = 10;
  const top = 12;
  const bottom = 122;
  const plotWidth = width - left - right;
  const plotHeight = bottom - top;
  const visibleSamples = samples.slice(-60);
  const scaleMax = Math.max(max, ...visibleSamples, value, 1);
  const points = visibleSamples.map((sample, index) => ({
    x:
      left +
      (visibleSamples.length === 1
        ? plotWidth
        : (index / (visibleSamples.length - 1)) * plotWidth),
    y: bottom - (Math.max(0, sample) / scaleMax) * plotHeight,
  }));
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = points.length
    ? `${left},${bottom} ${linePoints} ${points[points.length - 1].x},${bottom}`
    : "";
  const averageY = bottom - (Math.max(0, average) / scaleMax) * plotHeight;

  return (
    <div className="space-y-3">
      <svg
        className="block h-auto w-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Token speed trend chart"
      >
        <title>Token speed trend</title>
        <defs>
          <linearGradient id="token-speed-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.01" />
          </linearGradient>
          <filter
            id="token-speed-glow"
            x="-30%"
            y="-50%"
            width="160%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[0, 0.5, 1].map((fraction) => {
          const y = top + plotHeight * fraction;
          const label = Math.round(scaleMax * (1 - fraction));
          return (
            <g key={fraction}>
              <line
                x1={left}
                y1={y}
                x2={width - right}
                y2={y}
                stroke="#38bdf8"
                strokeOpacity={fraction === 1 ? 0.2 : 0.1}
                strokeDasharray={fraction === 1 ? undefined : "3 6"}
              />
              <text
                x={left - 8}
                y={y + 3}
                textAnchor="end"
                fill="#7dd3fc"
                fillOpacity="0.62"
                fontSize="8"
              >
                {label}
              </text>
            </g>
          );
        })}
        {average > 0 && (
          <line
            x1={left}
            y1={averageY}
            x2={width - right}
            y2={averageY}
            stroke="#67e8f9"
            strokeOpacity="0.55"
            strokeDasharray="4 5"
          />
        )}
        {points.length > 0 && (
          <>
            <polygon points={areaPoints} fill="url(#token-speed-area)" />
            <polyline
              points={linePoints}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#token-speed-glow)"
            />
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="4"
              fill="#e0f2fe"
              stroke="#38bdf8"
              strokeWidth="2"
              filter="url(#token-speed-glow)"
            />
          </>
        )}
        <text x={left} y={145} fill="#0FD340" fillOpacity="0.85" fontSize="8">
          Past {visibleSamples.length} times samples
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-3 border-t border-sky-400/15 pt-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground text-center">
            CURRENT SPEED
          </div>
          <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-sky-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.55)] text-center">
            {Math.round(value).toLocaleString()}
            <span className="ml-1 text-[10px] font-normal text-sky-200/60 ">
              Tokens/s
            </span>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground text-center">
            AVERAGE SPEED
          </div>
          <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-cyan-200 text-center">
            {Math.round(average).toLocaleString()}
            <span className="ml-1 text-[10px] font-normal text-cyan-100/50 text-center">
              Tokens/s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
