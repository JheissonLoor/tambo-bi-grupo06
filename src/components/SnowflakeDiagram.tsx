import { useState, type CSSProperties } from "react";
import { Database, KeyRound, Link2 } from "lucide-react";
import { dataDictionary } from "../data/dataDictionary";
import { useAnimatedProgress } from "../hooks/useDashboardMotion";

type DiagramNode = {
  id: string;
  label: string;
  kind: "fact" | "dimension" | "subdimension";
  x: number;
  y: number;
  width: number;
  height: number;
};

const nodes: DiagramNode[] = [
  { id: "hecho_ventas", label: "Hecho_Ventas", kind: "fact", x: 515, y: 308, width: 210, height: 104 },
  { id: "dim_producto", label: "Dim_Producto", kind: "dimension", x: 340, y: 190, width: 170, height: 56 },
  { id: "dim_tienda", label: "Dim_Tienda", kind: "dimension", x: 340, y: 600, width: 170, height: 56 },
  { id: "dim_promocion", label: "Dim_Promocion", kind: "dimension", x: 900, y: 190, width: 170, height: 56 },
  { id: "dim_cliente", label: "Dim_Cliente", kind: "dimension", x: 900, y: 600, width: 170, height: 56 },
  { id: "dim_tiempo", label: "Dim_Tiempo", kind: "dimension", x: 535, y: 646, width: 170, height: 56 },
  { id: "dim_subcategoria", label: "Dim_Subcategoria", kind: "subdimension", x: 150, y: 120, width: 158, height: 48 },
  { id: "dim_categoria", label: "Dim_Categoria", kind: "subdimension", x: 150, y: 280, width: 158, height: 48 },
  { id: "dim_marca", label: "Dim_Marca", kind: "subdimension", x: 150, y: 440, width: 158, height: 48 },
  { id: "dim_distrito", label: "Dim_Distrito", kind: "subdimension", x: 150, y: 600, width: 158, height: 48 },
  { id: "dim_ciudad", label: "Dim_Ciudad", kind: "subdimension", x: 150, y: 740, width: 158, height: 48 },
  { id: "dim_tipo_promocion", label: "Dim_TipoPromocion", kind: "subdimension", x: 1088, y: 120, width: 158, height: 48 },
  { id: "dim_campania", label: "Dim_Campania", kind: "subdimension", x: 1088, y: 280, width: 158, height: 48 },
  { id: "dim_tipo_cliente", label: "Dim_TipoCliente", kind: "subdimension", x: 1088, y: 600, width: 158, height: 48 },
];

const edges: Array<[string, string]> = [
  ["hecho_ventas", "dim_producto"],
  ["hecho_ventas", "dim_tienda"],
  ["hecho_ventas", "dim_promocion"],
  ["hecho_ventas", "dim_cliente"],
  ["hecho_ventas", "dim_tiempo"],
  ["dim_producto", "dim_subcategoria"],
  ["dim_subcategoria", "dim_categoria"],
  ["dim_producto", "dim_marca"],
  ["dim_tienda", "dim_distrito"],
  ["dim_distrito", "dim_ciudad"],
  ["dim_promocion", "dim_tipo_promocion"],
  ["dim_promocion", "dim_campania"],
  ["dim_cliente", "dim_tipo_cliente"],
];

const nodeMap = new Map(nodes.map((node) => [node.id, node]));

export function SnowflakeDiagram() {
  const [activeId, setActiveId] = useState("");
  const progress = useAnimatedProgress("snowflake-diagram", 1100);
  const activeNode = nodeMap.get(activeId) ?? nodes[0];
  const table = dataDictionary.find((item) => item.name === activeNode.id);
  const related = new Set<string>();
  if (activeId) {
    related.add(activeId);
    edges.forEach(([source, target]) => {
      if (source === activeId || target === activeId) {
        related.add(source);
        related.add(target);
      }
    });
  }

  return (
    <div className={`snowflake-diagram ${activeId ? "snowflake-diagram--active" : ""}`}>
      <div className="snowflake-diagram__scroll" tabIndex={0} aria-label="Diagrama dimensional desplazable">
        <svg className="snowflake-svg" viewBox="0 0 1260 800" role="img" aria-labelledby="snowflake-title snowflake-description" onMouseLeave={() => setActiveId("")}>
          <title id="snowflake-title">Modelo dimensional en copo de nieve</title>
          <desc id="snowflake-description">Hecho Ventas conectado con cinco dimensiones y ocho subdimensiones normalizadas.</desc>
          <defs>
            <filter id="fact-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="13" result="blur" /><feColorMatrix in="blur" values="1 0 0 0 0.96 0 1 0 0 0.58 0 0 1 0 0.08 0 0 0 .38 0" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <linearGradient id="fact-fill" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#F5A623" /><stop offset="1" stopColor="#F7A51E" /></linearGradient>
          </defs>
          <g className="snowflake-edges">
            {edges.map(([sourceId, targetId], index) => {
              const source = nodeMap.get(sourceId)!;
              const target = nodeMap.get(targetId)!;
              const active = Boolean(activeId) && (activeId === sourceId || activeId === targetId);
              const edgeProgress = Math.min(1, Math.max(0, progress * 1.35 - index * .035));
              return <path key={`${sourceId}-${targetId}`} pathLength={1} className={active ? "snowflake-edge snowflake-edge--active" : "snowflake-edge"} style={{ strokeDasharray: 1, strokeDashoffset: 1 - edgeProgress }} d={edgePath(source, target)} />;
            })}
          </g>
          <g className="snowflake-nodes">
            {nodes.map((node, index) => {
              const isActive = activeId === node.id;
              const isRelated = related.has(node.id);
              const tableData = dataDictionary.find((item) => item.name === node.id);
              return (
                <g
                  key={node.id}
                  className={`snowflake-node snowflake-node--${node.kind} ${isActive ? "snowflake-node--active" : ""} ${isRelated ? "snowflake-node--related" : ""}`}
                  style={{ "--node-delay": `${index * 38}ms` } as CSSProperties}
                  role="button"
                  tabIndex={0}
                  aria-label={`${kindLabel(node.kind)} ${node.label}. ${tableData?.columns.length ?? 0} columnas`}
                  onMouseEnter={() => setActiveId(node.id)}
                  onFocus={() => setActiveId(node.id)}
                  onClick={() => setActiveId(node.id)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveId(node.id); } }}
                >
                  <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={node.kind === "fact" ? 15 : 11} />
                  <text className="snowflake-node__kind" x={node.x + 14} y={node.y + (node.kind === "fact" ? 25 : 18)}>{kindLabel(node.kind)}</text>
                  <text className="snowflake-node__title" x={node.x + 14} y={node.y + (node.kind === "fact" ? 56 : 38)}>{node.label}</text>
                  {node.kind === "fact" ? <text className="snowflake-node__meta" x={node.x + 14} y={node.y + 81}>5 medidas · {tableData?.columns.length ?? 12} columnas</text> : null}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <section className="schema-inspector" aria-live="polite">
        <div className="schema-inspector__identity">
          <span>{kindLabel(activeNode.kind)}</span>
          <strong>{activeNode.label}</strong>
          <p>{table?.purpose}</p>
        </div>
        <div className="schema-inspector__summary"><Database size={15} /><span>{table?.columns.length ?? 0} columnas</span><Link2 size={15} /><span>{edges.filter(([source, target]) => source === activeNode.id || target === activeNode.id).length} relaciones</span></div>
        <div className="schema-inspector__fields">
          {table?.columns.map((column) => <span className={`schema-field ${column.key ? "schema-field--key" : ""}`} title={column.description} key={column.name}>{column.key ? <KeyRound size={11} /> : null}<b>{column.name}</b><small>{column.key ?? column.type}</small></span>)}
        </div>
      </section>
    </div>
  );
}

function kindLabel(kind: DiagramNode["kind"]) {
  if (kind === "fact") return "TABLA DE HECHOS";
  if (kind === "dimension") return "DIMENSIÓN";
  return "SUBDIMENSIÓN";
}

function edgePath(source: DiagramNode, target: DiagramNode) {
  const sourceCenter = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
  const horizontal = Math.abs(targetCenter.x - sourceCenter.x) >= Math.abs(targetCenter.y - sourceCenter.y);
  if (horizontal) {
    const sourceX = targetCenter.x < sourceCenter.x ? source.x : source.x + source.width;
    const targetX = targetCenter.x < sourceCenter.x ? target.x + target.width : target.x;
    const bend = (targetX - sourceX) * .45;
    return `M ${sourceX} ${sourceCenter.y} C ${sourceX + bend} ${sourceCenter.y}, ${targetX - bend} ${targetCenter.y}, ${targetX} ${targetCenter.y}`;
  }
  const sourceY = targetCenter.y < sourceCenter.y ? source.y : source.y + source.height;
  const targetY = targetCenter.y < sourceCenter.y ? target.y + target.height : target.y;
  const bend = (targetY - sourceY) * .45;
  return `M ${sourceCenter.x} ${sourceY} C ${sourceCenter.x} ${sourceY + bend}, ${targetCenter.x} ${targetY - bend}, ${targetCenter.x} ${targetY}`;
}
