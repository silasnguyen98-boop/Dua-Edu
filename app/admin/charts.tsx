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
