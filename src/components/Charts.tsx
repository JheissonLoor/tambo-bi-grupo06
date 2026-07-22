import { useId, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useAnimatedProgress } from "../hooks/useDashboardMotion";
import { money, number } from "../utils/format";

type ChartItem = { label: string; value: number; color?: string };
type TooltipRow = { label: string; value: string; color?: string };
type TooltipState = { x: number; y: number; rows: TooltipRow[] } | null;

export function BarChart({ data, height = 230, moneyValues = true }: { data: ChartItem[]; height?: number; moneyValues?: boolean }) {
  const titleId = useId();
  const descriptionId = useId();
  const progress = useAnimatedProgress(dataKey(data));
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const max = Math.max(...data.map((item) => item.value), 1) * 1.08;
  const width = 680;
  const left = 50;
  const bottom = 40;
  const chartHeight = height - bottom - 14;
  const slot = (width - left - 12) / Math.max(data.length, 1);
  const barWidth = Math.min(52, slot * .58);
  const formatter = moneyValues ? (value: number) => money(value) : (value: number) => number(value, 1);
  return (
    <div className="chart-stage" onMouseLeave={() => { setHovered(null); setTooltip(null); }}>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
        <title id={titleId}>Gráfico de barras</title>
        <desc id={descriptionId}>{describeItems(data, formatter)}</desc>
        {[0, .25, .5, .75, 1].map((ratio) => {
          const y = 10 + chartHeight * (1 - ratio);
          return <g key={ratio}><line x1={left} x2={width - 8} y1={y} y2={y} className="chart-grid" /><text x={left - 8} y={y + 4} textAnchor="end" className="chart-axis">{number(max * ratio, 0)}</text></g>;
        })}
        {data.map((item, index) => {
          const fullHeight = Math.max(2, chartHeight * item.value / max);
          const animatedHeight = fullHeight * progress;
          const x = left + slot * index + (slot - barWidth) / 2;
          const y = 10 + chartHeight - animatedHeight;
          const color = item.color ?? "#f5a623";
          return (
            <g
              key={`${item.label}-${index}`}
              className={`chart-mark ${hovered === index ? "chart-mark--active" : ""}`}
              style={{ opacity: hovered == null || hovered === index ? 1 : .32 }}
              onMouseEnter={() => setHovered(index)}
              onMouseMove={(event) => setTooltipAt(event, setTooltip, [{ label: item.label, value: formatter(item.value), color }])}
              onMouseLeave={() => setTooltip(null)}
            >
              <rect className="chart-bar-hit" x={x - slot * .18} y="8" width={barWidth + slot * .36} height={chartHeight + 4} fill="transparent" />
              <rect className="chart-bar" x={x} y={y} width={barWidth} height={animatedHeight} rx={6} fill={color} />
              <text x={x + barWidth / 2} y={Math.max(10, y - 7)} textAnchor="middle" className="chart-value" opacity={progress > .72 ? 1 : 0}>{formatter(item.value)}</text>
              <text x={x + barWidth / 2} y={height - 15} textAnchor="middle" className="chart-label">{shortLabel(item.label)}</text>
            </g>
          );
        })}
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}

export function HorizontalBarChart({ data, moneyValues = true }: { data: ChartItem[]; moneyValues?: boolean }) {
  const progress = useAnimatedProgress(dataKey(data));
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const max = Math.max(...data.map((item) => item.value), 1);
  const formatter = moneyValues ? (value: number) => money(value) : (value: number) => `${number(value, 1)}%`;
  return (
    <div className="horizontal-chart" onMouseLeave={() => { setHovered(null); setTooltip(null); }}>
      {data.map((item, index) => {
        const color = item.color ?? palette[index % palette.length];
        return <div
          className={`horizontal-row ${hovered === index ? "horizontal-row--active" : ""}`}
          style={{ opacity: hovered == null || hovered === index ? 1 : .38 }}
          key={item.label}
          onMouseEnter={() => setHovered(index)}
          onMouseMove={(event) => setTooltipAt(event, setTooltip, [{ label: item.label, value: formatter(item.value), color }])}
        >
          <span title={item.label}>{item.label}</span>
          <div className="horizontal-track"><i style={{ width: `${item.value / max * 100 * progress}%`, background: color }} /></div>
          <b>{formatter(item.value)}</b>
        </div>;
      })}
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}

export function LineAreaChart({ data, secondaryData, height = 245 }: { data: Array<{ label: string; value: number }>; secondaryData?: Array<{ label: string; value: number }>; height?: number }) {
  const gradient = useId();
  const titleId = useId();
  const descriptionId = useId();
  const progress = useAnimatedProgress(`${dataKey(data)}|${dataKey(secondaryData ?? [])}`);
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const width = 720;
  const pad = { left: 44, right: 14, top: 18, bottom: 34 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...data.map((point) => point.value), ...(secondaryData ?? []).map((point) => point.value), 1);
  const min = Math.min(...data.map((point) => point.value), ...(secondaryData ?? []).map((point) => point.value), 0);
  const span = Math.max(max - min, 1);
  const points = data.map((point, index) => ({ ...point, x: pad.left + (data.length <= 1 ? innerW / 2 : index * innerW / (data.length - 1)), y: pad.top + innerH - (point.value - min) * innerH / span }));
  const secondaryPoints = (secondaryData ?? []).map((point, index) => ({ ...point, x: pad.left + ((secondaryData?.length ?? 0) <= 1 ? innerW / 2 : index * innerW / ((secondaryData?.length ?? 1) - 1)), y: pad.top + innerH - (point.value - min) * innerH / span }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const secondaryLine = secondaryPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length ? `M ${points[0].x} ${pad.top + innerH} L ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points.at(-1)!.x} ${pad.top + innerH} Z` : "";
  const activePoint = hovered == null ? null : points[hovered];
  const activeSecondary = hovered == null ? null : secondaryPoints[hovered];
  const hover = (event: ReactMouseEvent<SVGRectElement>, index: number) => {
    setHovered(index);
    const rows: TooltipRow[] = [{ label: "Con promoción", value: money(points[index].value), color: "#f5a623" }];
    if (secondaryPoints[index]) rows.push({ label: "Sin promoción", value: money(secondaryPoints[index].value), color: "#8794a8" });
    setTooltipAt(event, setTooltip, [{ label: points[index].label, value: "", color: "#4cc9e6" }, ...rows]);
  };
  return (
    <div className="line-chart-wrap" onMouseLeave={() => { setHovered(null); setTooltip(null); }}>
      <div className="chart-stage">
        <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
          <title id={titleId}>Tendencia de ventas</title>
          <desc id={descriptionId}>{`Serie principal: ${describeItems(data, money)}${secondaryData ? `. Serie comparativa: ${describeItems(secondaryData, money)}` : ""}`}</desc>
          <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f5a623" stopOpacity=".32" /><stop offset="1" stopColor="#f5a623" stopOpacity="0" /></linearGradient></defs>
          {[0, .25, .5, .75, 1].map((ratio) => {
            const y = pad.top + innerH * (1 - ratio);
            return <g key={ratio}><line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="chart-grid" /><text x={pad.left - 7} y={y + 4} textAnchor="end" className="chart-axis">{number(min + span * ratio, 0)}</text></g>;
          })}
          {area ? <path className="chart-area" d={area} fill={`url(#${gradient})`} opacity={progress * .95} /> : null}
          <polyline className="chart-line chart-line--primary" points={line} fill="none" stroke="#f5a623" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" style={{ strokeDasharray: 1400, strokeDashoffset: 1400 * (1 - progress) }} />
          {secondaryLine ? <polyline className="chart-line chart-line--secondary" points={secondaryLine} fill="none" stroke="#8794a8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity={progress} /> : null}
          {activePoint ? <g className="chart-crosshair"><line x1={activePoint.x} x2={activePoint.x} y1={pad.top} y2={pad.top + innerH} /><circle cx={activePoint.x} cy={activePoint.y} r="5" /><circle className="chart-crosshair__halo" cx={activePoint.x} cy={activePoint.y} r="10" /></g> : null}
          {activeSecondary ? <circle className="chart-secondary-point" cx={activeSecondary.x} cy={activeSecondary.y} r="4.5" /> : null}
          {points.filter((_, index) => index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 5) === 0).map((point) => <text key={point.label} x={point.x} y={height - 10} textAnchor="middle" className="chart-label">{point.label.slice(5)}</text>)}
          {points.map((point, index) => {
            const band = innerW / Math.max(points.length - 1, 1);
            return <rect key={`hit-${point.label}-${index}`} x={Math.max(pad.left, point.x - band / 2)} y={pad.top} width={Math.min(band, width - pad.right - Math.max(pad.left, point.x - band / 2))} height={innerH} fill="transparent" onMouseEnter={(event) => hover(event, index)} onMouseMove={(event) => hover(event, index)} />;
          })}
        </svg>
        <ChartTooltip tooltip={tooltip} />
      </div>
      {secondaryData ? <div className="chart-legend"><span><i />Con promoción</span><span><i />Sin promoción</span></div> : null}
    </div>
  );
}

export function DivergingBars({ data }: { data: ChartItem[] }) {
  const progress = useAnimatedProgress(dataKey(data));
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1) * 1.15;
  return (
    <div className="diverging-chart" onMouseLeave={() => { setHovered(null); setTooltip(null); }}>
      {data.map((item, index) => {
        const width = Math.max(1.5, Math.abs(item.value) / max * 48 * progress);
        const negative = item.value < 0;
        return (
          <div
            className={`diverging-row ${hovered === index ? "diverging-row--active" : ""}`}
            style={{ opacity: hovered == null || hovered === index ? 1 : .38 }}
            key={item.label}
            onMouseEnter={() => setHovered(index)}
            onMouseMove={(event) => setTooltipAt(event, setTooltip, [{ label: item.label, value: money(item.value), color: negative ? "#ff6b5e" : "#4cc9e6" }])}
          >
            <span title={item.label}>{item.label}</span>
            <div className="diverging-track">
              <i className="diverging-zero" />
              <i className={negative ? "negative" : "positive"} style={{ width: `${width}%`, left: negative ? `calc(50% - ${width}%)` : "50%" }} />
              {negative && progress > .82 ? <em>MARGEN NEGATIVO</em> : null}
            </div>
            <b className={negative ? "text-negative" : ""}>{money(item.value)}</b>
          </div>
        );
      })}
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}

export function DonutChart({ data, centerLabel, valueFormatter = (value) => number(value, 0), centerFormatter = valueFormatter }: { data: ChartItem[]; centerLabel: string; valueFormatter?: (value: number) => string; centerFormatter?: (value: number) => string }) {
  const titleId = useId();
  const descriptionId = useId();
  const progress = useAnimatedProgress(dataKey(data));
  const [active, setActive] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const circumference = 2 * Math.PI * 62;
  let offset = 0;
  const activeItem = active == null ? null : data[active];
  return (
    <div className="donut-wrap" onMouseLeave={() => { setActive(null); setTooltip(null); }}>
      <div className="chart-stage donut-stage">
        <svg viewBox="0 0 180 180" className="donut" role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
          <title id={titleId}>Distribución de {centerLabel}</title>
          <desc id={descriptionId}>{describeItems(data, valueFormatter)}</desc>
          <circle cx="90" cy="90" r="62" fill="none" stroke="#212a36" strokeWidth="24" />
          {data.map((item, index) => {
            const part = item.value / total;
            const rotation = -90 + offset * 360;
            const middleAngle = (rotation + part * 180) * Math.PI / 180;
            offset += part;
            const selected = active === index;
            const shift = selected ? 4 : 0;
            const color = item.color ?? palette[index % palette.length];
            return <g key={item.label} transform={`translate(${Math.cos(middleAngle) * shift} ${Math.sin(middleAngle) * shift})`} style={{ opacity: active == null || selected ? 1 : .3 }}>
              <circle
                className="donut-segment"
                cx="90" cy="90" r="62" fill="none" stroke={color} strokeWidth="24"
                strokeDasharray={`${part * circumference * progress} ${circumference}`}
                transform={`rotate(${rotation} 90 90)`}
                onMouseEnter={() => setActive(index)}
                onMouseMove={(event) => setTooltipAt(event, setTooltip, [{ label: item.label, value: valueFormatter(item.value), color }, { label: "Participación", value: `${number(part * 100, 1)}%` }])}
              />
            </g>;
          })}
          <text x="90" y="86" textAnchor="middle" className="donut-number">{activeItem ? valueFormatter(activeItem.value) : centerFormatter(total)}</text>
          <text x="90" y="105" textAnchor="middle" className="donut-label">{activeItem ? shortLabel(activeItem.label) : centerLabel}</text>
        </svg>
        <ChartTooltip tooltip={tooltip} />
      </div>
      <div className="legend">{data.map((item, index) => <span key={item.label} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} style={{ opacity: active == null || active === index ? 1 : .3 }}><i style={{ background: item.color ?? palette[index % palette.length] }} />{item.label}<b>{valueFormatter(item.value)}</b></span>)}</div>
    </div>
  );
}

export function ScatterPlot({ data }: { data: Array<{ real: number; projected: number; id: number }> }) {
  const titleId = useId();
  const descriptionId = useId();
  const progress = useAnimatedProgress(data.map((point) => `${point.id}:${point.real}:${point.projected}`).join("|"));
  const [active, setActive] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const width = 620, height = 300, pad = 38;
  const values = data.flatMap((point) => [point.real, point.projected]);
  const min = Math.min(...values, 0), max = Math.max(...values, 1), span = Math.max(max - min, 1);
  const x = (value: number) => pad + (value - min) * (width - pad * 2) / span;
  const y = (value: number) => height - pad - (value - min) * (height - pad * 2) / span;
  return (
    <div className="chart-stage" onMouseLeave={() => { setActive(null); setTooltip(null); }}>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
        <title id={titleId}>Venta real frente a venta proyectada</title>
        <desc id={descriptionId}>{`${data.length} observaciones de prueba. Cada punto compara la venta real con la estimación del modelo técnico.`}</desc>
        {[0, .25, .5, .75, 1].map((ratio) => <g key={ratio}><line x1={pad} x2={width - pad} y1={y(min + span * ratio)} y2={y(min + span * ratio)} className="chart-grid" /><line y1={pad} y2={height - pad} x1={x(min + span * ratio)} x2={x(min + span * ratio)} className="chart-grid" /></g>)}
        <line className="scatter-reference" x1={x(min)} y1={y(min)} x2={x(max)} y2={y(max)} stroke="#66707f" style={{ strokeDasharray: 800, strokeDashoffset: 800 * (1 - progress) }} />
        {data.map((point, index) => <circle
          className="scatter-point"
          key={point.id}
          cx={x(point.real)} cy={y(point.projected)} r={active === index ? 7 : 5}
          fill="#4cc9e6" stroke="#0c1017" strokeWidth="1"
          style={{ opacity: (active == null || active === index ? .86 : .3) * progress }}
          onMouseEnter={() => setActive(index)}
          onMouseMove={(event) => setTooltipAt(event, setTooltip, [{ label: `Venta ${point.id}`, value: "", color: "#4cc9e6" }, { label: "Real", value: money(point.real) }, { label: "Proyectada", value: money(point.projected) }])}
        />)}
        <text x={width / 2} y={height - 7} textAnchor="middle" className="chart-label">Venta real</text>
        <text transform={`translate(12 ${height / 2}) rotate(-90)`} textAnchor="middle" className="chart-label">Venta proyectada</text>
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}

function ChartTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip) return null;
  const flip = typeof window !== "undefined" && tooltip.x > window.innerWidth - 210;
  return <div className={`chart-tooltip ${flip ? "chart-tooltip--flip" : ""}`} style={{ left: tooltip.x + (flip ? -14 : 14), top: tooltip.y + 14 }} role="status">
    {tooltip.rows.map((row, index) => <div key={`${row.label}-${index}`}>{row.color ? <i style={{ background: row.color }} /> : null}<span>{row.label}</span>{row.value ? <b>{row.value}</b> : null}</div>)}
  </div>;
}

function setTooltipAt(event: ReactMouseEvent<Element>, setter: (value: TooltipState) => void, rows: TooltipRow[]) {
  setter({ x: event.clientX, y: event.clientY, rows });
}

const palette = ["#f5a623", "#ff6b5e", "#4cc9e6", "#9b8cff", "#8794a8"];
const shortLabel = (label: string) => label.length > 14 ? `${label.slice(0, 13)}…` : label;
const dataKey = (data: ChartItem[]) => data.map((item) => `${item.label}:${item.value}`).join("|");
const describeItems = (data: ChartItem[], formatter: (value: number) => string) => data.length ? data.map((item) => `${item.label}: ${formatter(item.value)}`).join("; ") : "Sin datos disponibles.";
