import { useState } from 'react';

interface WeightPoint {
  date: Date;
  dateStr: string;
  weight: number;
  x: number;
  y: number;
}

export function WeightChart({ atenciones }: { atenciones: any[] }) {
  // Extract and sort weight records
  const points = atenciones
    .filter((a) => a.peso_actual && !isNaN(Number(a.peso_actual)))
    .map((a) => ({
      date: new Date(a.fecha_atencion),
      dateStr: new Date(a.fecha_atencion).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
      }),
      weight: Number(a.peso_actual),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const [hoveredPoint, setHoveredPoint] = useState<WeightPoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="weight-graph-empty">
        <p>No hay registros de peso para esta mascota.</p>
      </div>
    );
  }

  // Dimensions
  const width = 500;
  const height = 200;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find min/max
  const weights = points.map((p) => p.weight);
  const maxWeight = Math.max(...weights);
  const minWeight = Math.min(...weights);
  const weightRange = maxWeight - minWeight;

  // Add 10% padding to Y axis
  const yMax = maxWeight + (weightRange === 0 ? 2 : weightRange * 0.1);
  const yMin = Math.max(0, minWeight - (weightRange === 0 ? 2 : weightRange * 0.1));
  const yRange = yMax - yMin === 0 ? 1 : yMax - yMin;

  // Map points to SVG coordinates
  const svgPoints: WeightPoint[] = points.map((p, idx) => {
    const x =
      paddingLeft +
      (points.length === 1
        ? chartWidth / 2
        : (idx / (points.length - 1)) * chartWidth);
    const y =
      paddingTop +
      chartHeight -
      ((p.weight - yMin) / yRange) * chartHeight;
    return { x, y, ...p };
  });

  // Construct SVG Path
  let linePath = '';
  let areaPath = '';

  if (svgPoints.length > 0) {
    linePath =
      `M ${svgPoints[0].x} ${svgPoints[0].y} ` +
      svgPoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
    areaPath =
      linePath +
      ` L ${svgPoints[svgPoints.length - 1].x} ${paddingTop + chartHeight} L ${svgPoints[0].x} ${paddingTop + chartHeight} Z`;
  }

  // Y-axis ticks
  const yTicks = 4;
  const yTickValues = Array.from(
    { length: yTicks },
    (_, i) => yMin + (yRange / (yTicks - 1)) * i
  );

  return (
    <div className="weight-graph-container" style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTickValues.map((val, idx) => {
          const y =
            paddingTop +
            chartHeight -
            ((val - yMin) / yRange) * chartHeight;
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {val.toFixed(1)} kg
              </text>
            </g>
          );
        })}

        {/* Area under the line */}
        {svgPoints.length > 1 && <path d={areaPath} fill="url(#weightAreaGrad)" />}

        {/* The line */}
        {svgPoints.length > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* X-axis labels */}
        {svgPoints.map((p, idx) => {
          const shouldRenderLabel =
            points.length <= 6 ||
            idx === 0 ||
            idx === points.length - 1 ||
            idx === Math.floor(points.length / 2);
          if (!shouldRenderLabel) return null;
          return (
            <text
              key={idx}
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="9"
              fill="var(--text-muted)"
            >
              {p.dateStr}
            </text>
          );
        })}

        {/* Interactivity guide line */}
        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={paddingTop}
            x2={hoveredPoint.x}
            y2={paddingTop + chartHeight}
            stroke="var(--accent)"
            strokeOpacity="0.3"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        )}

        {/* Dots */}
        {svgPoints.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === idx ? 6 : 4}
            fill="var(--surface-solid)"
            stroke="var(--accent)"
            strokeWidth={hoveredIndex === idx ? 3 : 2}
            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            onMouseEnter={() => {
              setHoveredPoint(p);
              setHoveredIndex(idx);
            }}
            onMouseLeave={() => {
              setHoveredPoint(null);
              setHoveredIndex(null);
            }}
          />
        ))}
      </svg>

      {/* Tooltip Overlay */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 45}%`,
            transform: 'translateX(-50%)',
            background: 'var(--surface-solid)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '4px 8px',
            boxShadow: 'var(--shadow)',
            pointerEvents: 'none',
            zIndex: 10,
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            color: 'var(--text-h)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <strong>{hoveredPoint.weight} kg</strong>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {hoveredPoint.dateStr}
          </span>
        </div>
      )}
    </div>
  );
}
