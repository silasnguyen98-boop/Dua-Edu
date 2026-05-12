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

export function PieChart({ emptyText, items }: { emptyText: string; items: ChartItem[] }) {
  let cursor = 0;
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const segments = items.map((item, index) => {
    const start = cursor;
    cursor += total ? (item.value / total) * 100 : 0;
    const end = index === items.length - 1 ? 100 : cursor;
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
        style={{ background: `conic-gradient(${segments.join(", ")})` }}
      >
        <span>{items.length}</span>
      </div>
      <div className="pie-legend">
        {items.map((item) => (
          <div className="legend-row" key={item.id}>
            <span className="legend-dot" style={{ background: item.color }} />
            <span>{item.label}</span>
            <strong>{item.percent}%</strong>
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

  const height = 120;
  const width = 400;
  const padding = 20;
  const maxValue = 100;

  const points = items.map((item, i) => {
    const x = padding + (i * (width - 2 * padding)) / (items.length - 1);
    const y = height - padding - (item.value / maxValue) * (height - 2 * padding);
    return { x, y };
  });

  const d = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;

  return (
    <div className="line-chart-container" style={{ width: "100%", overflowX: "auto", padding: "10px 0" }}>
      <svg height={height} style={{ overflow: "visible" }} viewBox={`0 0 ${width} ${height}`} width="100%">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = height - padding - (v / maxValue) * (height - 2 * padding);
          return (
            <g key={v}>
              <line stroke="#e2e8f0" strokeDasharray="4 4" x1={padding} x2={width - padding} y1={y} y2={y} />
              <text fill="#94a3b8" fontSize="10" x="0" y={y + 4}>{v}%</text>
            </g>
          );
        })}
        {/* Line */}
        <path d={d} fill="none" stroke="#6366f1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} fill="white" r="4" stroke="#6366f1" strokeWidth="2" />
            <text fill="#64748b" fontSize="10" fontWeight="600" textAnchor="middle" x={p.x} y={height}>{items[i].label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
