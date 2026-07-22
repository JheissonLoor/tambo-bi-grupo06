import { useId, useState } from "react";
import { money, number } from "../utils/format";

type ChartItem = { label: string; value: number; color?: string };

export function BarChart({ data, height = 230, moneyValues = true }: { data: ChartItem[]; height?: number; moneyValues?: boolean }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const width = 680;
  const left = 50;
  const bottom = 40;
  const chartHeight = height - bottom - 14;
  const slot = (width - left - 12) / Math.max(data.length, 1);
  const barWidth = Math.min(52, slot * 0.58);
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de barras">
      {[0, .25, .5, .75, 1].map((ratio) => {
        const y = 10 + chartHeight * (1 - ratio);
        return <g key={ratio}><line x1={left} x2={width - 8} y1={y} y2={y} className="chart-grid" /><text x={left - 8} y={y + 4} textAnchor="end" className="chart-axis">{moneyValues ? number(max * ratio, 0) : number(max * ratio, 0)}</text></g>;
      })}
      {data.map((item, index) => {
        const h = Math.max(2, chartHeight * item.value / max);
        const x = left + slot * index + (slot - barWidth) / 2;
        const y = 10 + chartHeight - h;
        return (
          <g key={`${item.label}-${index}`} className="chart-mark">
            <title>{`${item.label}: ${moneyValues ? money(item.value) : number(item.value, 1)}`}</title>
            <rect x={x} y={y} width={barWidth} height={h} rx={6} fill={item.color ?? "#f5a623"} />
            <text x={x + barWidth / 2} y={Math.max(10, y - 7)} textAnchor="middle" className="chart-value">{moneyValues ? money(item.value, 0) : number(item.value, 1)}</text>
            <text x={x + barWidth / 2} y={height - 15} textAnchor="middle" className="chart-label">{shortLabel(item.label)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function LineAreaChart({ data, secondaryData, height = 245 }: { data: Array<{ label: string; value: number }>; secondaryData?: Array<{ label: string; value: number }>; height?: number }) {
  const gradient = useId();
  const width = 720;
  const pad = { left: 44, right: 14, top: 18, bottom: 34 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...data.map((point) => point.value), ...(secondaryData ?? []).map((point) => point.value), 1);
  const min = Math.min(...data.map((point) => point.value), ...(secondaryData ?? []).map((point) => point.value), 0);
  const span = Math.max(max - min, 1);
  const points = data.map((point, index) => ({
    ...point,
    x: pad.left + (data.length <= 1 ? innerW / 2 : index * innerW / (data.length - 1)),
    y: pad.top + innerH - (point.value - min) * innerH / span,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const secondaryPoints = (secondaryData ?? []).map((point, index) => ({
    ...point,
    x: pad.left + ((secondaryData?.length ?? 0) <= 1 ? innerW / 2 : index * innerW / ((secondaryData?.length ?? 1) - 1)),
    y: pad.top + innerH - (point.value - min) * innerH / span,
  }));
  const secondaryLine = secondaryPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length ? `M ${points[0].x} ${pad.top + innerH} L ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points.at(-1)!.x} ${pad.top + innerH} Z` : "";
  return (
    <div className="line-chart-wrap">
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tendencia de ventas">
      <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f5a623" stopOpacity=".32" /><stop offset="1" stopColor="#f5a623" stopOpacity="0" /></linearGradient></defs>
      {[0, .25, .5, .75, 1].map((ratio) => {
        const y = pad.top + innerH * (1 - ratio);
        return <g key={ratio}><line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="chart-grid" /><text x={pad.left - 7} y={y + 4} textAnchor="end" className="chart-axis">{number(min + span * ratio, 0)}</text></g>;
      })}
      {area ? <path d={area} fill={`url(#${gradient})`} /> : null}
      <polyline points={line} fill="none" stroke="#f5a623" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {secondaryLine ? <polyline points={secondaryLine} fill="none" stroke="#8794a8" strokeWidth="2" strokeDasharray="6 5" strokeLinejoin="round" strokeLinecap="round" /> : null}
      {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="4" fill="#151b26" stroke="#f5a623" strokeWidth="2"><title>{`${point.label}: ${money(point.value)}`}</title></circle>)}
      {secondaryPoints.map((point, index) => <circle key={`secondary-${index}`} cx={point.x} cy={point.y} r="3" fill="#151b26" stroke="#8794a8" strokeWidth="1.5"><title>{`${point.label}: ${money(point.value)}`}</title></circle>)}
      {points.filter((_, index) => index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 5) === 0).map((point) => <text key={point.label} x={point.x} y={height - 10} textAnchor="middle" className="chart-label">{point.label.slice(5)}</text>)}
    </svg>
    {secondaryData ? <div className="chart-legend"><span><i />Con promoción</span><span><i />Sin promoción</span></div> : null}
    </div>
  );
}

export function DivergingBars({ data }: { data: ChartItem[] }) {
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);
  return (
    <div className="diverging-chart">
      {data.map((item) => {
        const width = `${Math.max(2, Math.abs(item.value) / max * 48)}%`;
        const negative = item.value < 0;
        return (
          <div className="diverging-row" key={item.label}>
            <span>{item.label}</span>
            <div className="diverging-track">
              <i className="diverging-zero" />
              <i className={negative ? "negative" : "positive"} style={{ width, left: negative ? `calc(50% - ${width})` : "50%" }} title={`${item.label}: ${money(item.value)}`} />
            </div>
            <b className={negative ? "text-negative" : ""}>{money(item.value)}</b>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({ data, centerLabel }: { data: ChartItem[]; centerLabel: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 180 180" className="donut" role="img" aria-label="Distribución">
        <circle cx="90" cy="90" r="62" fill="none" stroke="#212a36" strokeWidth="24" />
        {data.map((item, index) => {
          const part = item.value / total;
          const dash = `${part * 389.56} ${389.56 - part * 389.56}`;
          const rotation = -90 + offset * 360;
          offset += part;
          return <circle key={item.label} cx="90" cy="90" r="62" fill="none" stroke={item.color ?? palette[index % palette.length]} strokeWidth="24" strokeDasharray={dash} transform={`rotate(${rotation} 90 90)`}><title>{`${item.label}: ${number(part * 100, 1)}%`}</title></circle>;
        })}
        <text x="90" y="86" textAnchor="middle" className="donut-number">{number(total, 0)}</text>
        <text x="90" y="105" textAnchor="middle" className="donut-label">{centerLabel}</text>
      </svg>
      <div className="legend">{data.map((item, index) => <span key={item.label}><i style={{ background: item.color ?? palette[index % palette.length] }} />{item.label}<b>{number(item.value, 0)}</b></span>)}</div>
    </div>
  );
}

export function ScatterPlot({ data }: { data: Array<{ real: number; projected: number; id: number }> }) {
  const width = 620, height = 300, pad = 38;
  const values = data.flatMap((point) => [point.real, point.projected]);
  const min = Math.min(...values, 0), max = Math.max(...values, 1), span = Math.max(max - min, 1);
  const x = (value: number) => pad + (value - min) * (width - pad * 2) / span;
  const y = (value: number) => height - pad - (value - min) * (height - pad * 2) / span;
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Venta real frente a proyectada">
      {[0, .25, .5, .75, 1].map((ratio) => <g key={ratio}><line x1={pad} x2={width - pad} y1={y(min + span * ratio)} y2={y(min + span * ratio)} className="chart-grid" /><line y1={pad} y2={height - pad} x1={x(min + span * ratio)} x2={x(min + span * ratio)} className="chart-grid" /></g>)}
      <line x1={x(min)} y1={y(min)} x2={x(max)} y2={y(max)} stroke="#66707f" strokeDasharray="5 5" />
      {data.map((point) => <circle key={point.id} cx={x(point.real)} cy={y(point.projected)} r="5" fill="#4cc9e6" fillOpacity=".82" stroke="#0c1017" strokeWidth="1"><title>{`Venta ${point.id}: real ${money(point.real)}, proyectada ${money(point.projected)}`}</title></circle>)}
      <text x={width / 2} y={height - 7} textAnchor="middle" className="chart-label">Venta real</text>
      <text transform={`translate(12 ${height / 2}) rotate(-90)`} textAnchor="middle" className="chart-label">Venta proyectada</text>
    </svg>
  );
}

const palette = ["#f5a623", "#ff6b5e", "#4cc9e6", "#9b8cff", "#8794a8"];
const shortLabel = (label: string) => label.length > 12 ? `${label.slice(0, 11)}…` : label;
