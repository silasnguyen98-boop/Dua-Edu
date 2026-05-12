import type { ChartItem } from "./types";

export function BarChart({ emptyText, items }: { emptyText: string; items: ChartItem[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  if (!items.length) {
    return <p className="empty-chart">{emptyText}</p>;
  }

  return (
    <div className="bar-chart">
      {items.map((item) => (
        <div className="bar-row" key={item.id}>
          <div className="bar-meta">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="bar-track" aria-label={`${item.label}: ${item.value} ghi danh`}>
            <span
              className="bar-fill"
              style={{
                background: item.color,
                width: `${maxValue ? Math.max((item.value / maxValue) * 100, 4) : 0}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PieChart({ emptyText, items, centerLabel, centerValue }: { emptyText: string; items: ChartItem[]; centerLabel?: string; centerValue?: string | number }) {
  let cursor = 0;
  const total = items.reduce((sum, item) => sum + item.value, 0);
  
  // Filter out zero-value items for segments to avoid potential gradient artifacts, but keep for legend
  const activeItems = items.filter(item => item.value > 0);
  const segments = activeItems.map((item, index) => {
    const start = cursor;
    cursor += total ? (item.value / total) * 100 : 0;
    const end = index === activeItems.length - 1 ? 100 : cursor;
    return `${item.color} ${start}% ${end}%`;
  });

  if (!items.length) {
    return <p className="empty-chart">{emptyText}</p>;
  }

  return (
    <div className="pie-layout">
      <div
        aria-label="Biểu đồ tròn"
        className="pie-chart"
        role="img"
        style={{ background: total > 0 ? `conic-gradient(${segments.join(", ")})` : "#f1f5f9" }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
          <strong style={{ fontSize: "24px" }}>{centerValue}</strong>
          {centerLabel && <small style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px" }}>{centerLabel}</small>}
        </div>
      </div>
      <div className="pie-legend">
        {items.map((item) => (
          <div className="legend-row" key={item.id}>
            <span className="legend-dot" style={{ background: item.color }} />
            <span style={{ fontSize: "12px" }}>{item.label}</span>
            <strong style={{ fontSize: "12px" }}>{item.percent}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export function LineChart({ items }: { items: { label: string; value: number }[] }) {
  if (items.length < 2) {
    return (
      <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
        Cần ít nhất 2 buổi để vẽ biểu đồ đường
      </div>
    );
  }

  const height = 160;
  const width = 440;
  const padding = 35;
  const maxValue = 100;

  const points = items.map((item, i) => {
    const x = padding + (i * (width - 2 * padding)) / (items.length - 1);
    const y = height - padding - (item.value / maxValue) * (height - 2 * padding);
    return { x, y };
  });

  const d = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;

  const values = items.map(item => item.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);

  return (
    <div className="line-chart-container" style={{ width: "100%", overflowX: "auto", padding: "20px 0" }}>
      <svg height={height} style={{ overflow: "visible" }} viewBox={`0 0 ${width} ${height}`} width="100%">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = height - padding - (v / maxValue) * (height - 2 * padding);
          return (
            <g key={v}>
              <line stroke="#f1f5f9" strokeDasharray="4 4" x1={padding} x2={width - padding} y1={y} y2={y} />
              <text fill="#cbd5e1" fontSize="10" x="4" y={y + 4}>{v}%</text>
            </g>
          );
        })}
        {/* Line */}
        <path d={d} fill="none" stroke="#6366f1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {/* Points */}
        {points.map((p, i) => {
          const isMax = items[i].value === maxVal && maxVal !== minVal;
          const isMin = items[i].value === minVal && maxVal !== minVal;
          const isLast = i === items.length - 1;
          
          const pointColor = isMax ? "#10b981" : isMin ? "#ef4444" : isLast ? "#6366f1" : "#cbd5e1";
          const strokeWidth = isLast || isMax || isMin ? 3 : 2;
          const radius = isLast ? 7 : 5;

          let diffText = "";
          let diffColor = "";
          if (isLast && i > 0) {
            const diff = items[i].value - items[i - 1].value;
            if (diff > 0) {
              diffText = `+${diff.toFixed(1)}%`;
              diffColor = "#10b981";
            } else if (diff < 0) {
              diffText = `${diff.toFixed(1)}%`;
              diffColor = "#ef4444";
            } else {
              diffText = "0%";
              diffColor = "#64748b";
            }
          }
          
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} fill="white" r={radius} stroke={pointColor} strokeWidth={strokeWidth} />
              
              { (isMax || isMin || isLast) && (
                <g>
                  <text fill={pointColor} fontSize="11" fontWeight="800" textAnchor="middle" x={p.x} y={p.y - 15}>
                    {items[i].value}%
                  </text>
                  {isLast && diffText && (
                    <text fill={diffColor} fontSize="10" fontWeight="700" textAnchor="middle" x={p.x} y={p.y - 28}>
                      {diffText}
                    </text>
                  )}
                </g>
              )}
              
              <text fill={isLast ? "var(--foreground)" : "#94a3b8"} fontSize="10" fontWeight={isLast ? "700" : "600"} textAnchor="middle" x={p.x} y={height - 10}>
                {items[i].label}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: "16px", marginTop: "12px", justifyContent: "center", fontSize: "11px", fontWeight: 600 }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#10b981" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} /> Cao nhất
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ef4444" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} /> Thấp nhất
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#6366f1" }}>
          <span style={{ width: 8, height: 8, border: "2px solid #6366f1", borderRadius: "50%", background: "white" }} /> Buổi mới nhất
        </span>
      </div>
    </div>
  );
}
