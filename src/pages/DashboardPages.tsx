import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, ArrowRight, BadgeCheck, BarChart3, Database, Layers3, Search, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { BarChart, DivergingBars, DivergingColumnChart, DonutChart, HorizontalBarChart, LineAreaChart, ScatterPlot } from "../components/Charts";
import { KpiCard, Tile } from "../components/Tile";
import { SnowflakeDiagram } from "../components/SnowflakeDiagram";
import { filtersKey } from "../components/DashboardShell";
import { useDashboardFilters } from "../context/FiltersContext";
import { getCustomers, getPredictive, getPromotions, getSales, getSummary } from "../data/tamboDataService";
import { dataDictionary } from "../data/dataDictionary";
import type { CustomersData, PredictiveData } from "../types/dashboard";
import { money, number } from "../utils/format";

const tones = ["#f5a623", "#ff6b5e", "#4cc9e6", "#9b8cff", "#8794a8"];
const asRows = <T extends object>(rows: T[]) => rows.map((row) => ({ ...row } as Record<string, unknown>));

export function SummaryPage() {
  const { filters } = useDashboardFilters();
  const query = useQuery({
    queryKey: ["tambo", "summary", ...filtersKey(filters)],
    queryFn: ({ signal }) => getSummary(filters, signal),
  });
  const salesQuery = useQuery({
    queryKey: ["tambo", "sales", ...filtersKey(filters)],
    queryFn: ({ signal }) => getSales(filters, signal),
  });
  const promotionsQuery = useQuery({
    queryKey: ["tambo", "promotions", ...filtersKey(filters)],
    queryFn: ({ signal }) => getPromotions(filters, signal),
  });
  const data = query.data;
  const state = { loading: query.isLoading, error: query.error, onRetry: query.refetch, onRefresh: query.refetch };
  const salesState = { loading: salesQuery.isLoading, error: salesQuery.error, onRetry: salesQuery.refetch, onRefresh: salesQuery.refetch };
  const promotionsState = { loading: promotionsQuery.isLoading, error: promotionsQuery.error, onRetry: promotionsQuery.refetch, onRefresh: promotionsQuery.refetch };
  return (
    <div className="page-stack">
      <div className="kpi-grid">
        <KpiCard id="kpi-ventas-promocion" label="Ventas por promoción" value={money(data?.kpis.ventasPromocion)} animatedValue={data?.kpis.ventasPromocion} valueFormatter={(value) => money(value)} detail={`${number(data?.kpis.transacciones)} transacciones filtradas`} tone="amber" exportRows={data ? [{ ventas_promocion: data.kpis.ventasPromocion }] : []} {...state} />
        <KpiCard id="kpi-margen" label="Margen de ganancia" value={`${number(data?.kpis.margenPorcentaje, 1)}%`} animatedValue={data?.kpis.margenPorcentaje} valueFormatter={(value) => `${number(value, 1)}%`} detail={`${money(data?.kpis.margenImporte)} acumulado`} tone="coral" exportRows={data ? [{ margen_porcentaje: data.kpis.margenPorcentaje, margen_importe: data.kpis.margenImporte }] : []} {...state} />
        <KpiCard id="kpi-incremento" label="Incremento de ventas" value={`${number(data?.kpis.incrementoPorcentaje, 1)}%`} animatedValue={data?.kpis.incrementoPorcentaje} valueFormatter={(value) => `${number(value, 1)}%`} detail="Con promoción vs. sin promoción" tone="teal" exportRows={data ? [{ incremento_porcentaje: data.kpis.incrementoPorcentaje }] : []} {...state} />
        <KpiCard id="kpi-frecuencia" label="Frecuencia declarada de uso" value={`${number(data?.kpis.frecuenciaUso, 2)} / 3`} animatedValue={data?.kpis.frecuenciaUso} valueFormatter={(value) => `${number(value, 2)} / 3`} detail={`Promedio de ${number(data?.kpis.respuestas)} respuestas · escala 0–3`} tone="violet" exportRows={data ? [{ frecuencia_uso: data.kpis.frecuenciaUso, respuestas: data.kpis.respuestas }] : []} {...state} />
      </div>
      <div className="analysis-grid analysis-grid--summary-top">
        <Tile id="resumen-tendencia" title="Tendencia de ventas" subtitle="agregación diaria · 01–30 junio 2026" className="tile--tall" exportRows={asRows(data?.tendencia ?? [])} empty={data?.tendencia.length === 0} {...state}>
          {data ? <LineAreaChart data={data.tendencia.map((point) => ({ label: point.fecha, value: point.ventas_promo ?? 0 }))} secondaryData={data.tendencia.map((point) => ({ label: point.fecha, value: point.ventas_sin_promo ?? 0 }))} /> : null}
        </Tile>
        <Tile id="resumen-formatos" title="Ventas por tipo de promoción" subtitle="soles por formato" className="tile--tall" exportRows={asRows(data?.ventasPorFormato ?? [])} empty={data?.ventasPorFormato.length === 0} {...state}>
          {data ? <BarChart data={data.ventasPorFormato.filter((item) => item.label !== "Sin promocion").map((item, index) => ({ label: item.label, value: item.value, color: tones[index % tones.length] }))} /> : null}
        </Tile>
      </div>
      <div className="analysis-grid analysis-grid--summary-bottom">
        <Tile id="resumen-margen-categorias" title="Margen por categoría" subtitle="participación en la utilidad" exportRows={asRows(salesQuery.data?.categorias ?? [])} empty={salesQuery.data?.categorias.length === 0} {...salesState}>
          {salesQuery.data ? <DonutChart centerLabel="S/ utilidad" valueFormatter={(value) => money(value, 2)} centerFormatter={(value) => number(value, 2)} data={salesQuery.data.categorias.map((item, index) => ({ label: item.categoria, value: Math.max(0, item.margen), color: tones[index % tones.length] }))} /> : null}
        </Tile>
        <Tile id="insight-2x1" title="Hallazgo crítico" subtitle="insight que justifica el proyecto" className="insight-tile" exportRows={data ? [{ ...data.insight2x1 }] : []} {...state}>
          {data ? <div className="insight-layout insight-layout--compact">
            <div className="insight-alert"><AlertTriangle size={26} /><div><strong>El 2x1 destruye margen</strong><span>Es el formato más preferido ({number(data.insight2x1.preferenciaPorcentaje, 0)}%) y registra margen negativo.</span></div></div>
            <div className="insight-metric insight-metric--preference"><span>Preferencia</span><strong>{number(data.insight2x1.preferenciaPorcentaje, 0)}%</strong><b>Encuesta de clientes</b></div>
            <div className="insight-metric insight-metric--negative"><span>Margen 2x1</span><strong>{number(data.insight2x1.margenPorcentaje, 1)}%</strong><b>{money(data.insight2x1.margen)}</b></div>
            <p>Recomendación: migrar volumen del 2x1 hacia combos, manteniendo la percepción de ahorro.</p>
          </div> : null}
        </Tile>
      </div>
      <Tile id="resumen-detalle-promociones" title="Detalle de promociones" subtitle="drill-down · 8 promociones del proyecto" exportRows={asRows(promotionsQuery.data?.detalle ?? [])} empty={promotionsQuery.data?.detalle.length === 0} {...promotionsState}>
        {promotionsQuery.data ? <DataTable columns={[{ key: "promocion", label: "Promoción" }, { key: "formato", label: "Formato" }, { key: "campania", label: "Campaña" }, { key: "transacciones", label: "Tx", format: (value) => number(Number(value)) }, { key: "ventas", label: "Ventas", format: (value) => money(Number(value)) }, { key: "margen", label: "Margen", format: (value) => money(Number(value)) }, { key: "margen_porcentaje", label: "%", format: (value) => `${number(Number(value), 1)}%` }]} rows={asRows(promotionsQuery.data.detalle)} /> : null}
      </Tile>
    </div>
  );
}

export function SalesPage() {
  const { filters } = useDashboardFilters();
  const query = useQuery({ queryKey: ["tambo", "sales", ...filtersKey(filters)], queryFn: ({ signal }) => getSales(filters, signal) });
  const data = query.data;
  const state = { loading: query.isLoading, error: query.error, onRetry: query.refetch, onRefresh: query.refetch };
  return <div className="page-stack">
    <div className="kpi-grid">
      <KpiCard id="ventas-total" label="Ventas totales" value={money(data?.kpis.ventas)} animatedValue={data?.kpis.ventas} valueFormatter={(value) => money(value)} detail="Importe del periodo filtrado" tone="amber" exportRows={data ? [{ ventas: data.kpis.ventas }] : []} {...state} />
      <KpiCard id="ventas-ticket" label="Ticket promedio" value={money(data?.kpis.ticket)} animatedValue={data?.kpis.ticket} valueFormatter={(value) => money(value)} detail="AVG(total_venta)" tone="coral" exportRows={data ? [{ ticket: data.kpis.ticket }] : []} {...state} />
      <KpiCard id="ventas-transacciones" label="Transacciones" value={number(data?.kpis.transacciones)} animatedValue={data?.kpis.transacciones} valueFormatter={(value) => number(value)} detail="COUNT(id_venta)" tone="teal" exportRows={data ? [{ transacciones: data.kpis.transacciones }] : []} {...state} />
      <KpiCard id="ventas-margen" label="Margen acumulado" value={money(data?.kpis.margen)} animatedValue={data?.kpis.margen} valueFormatter={(value) => money(value)} detail="Ventas menos costos" tone="violet" exportRows={data ? [{ margen: data.kpis.margen }] : []} {...state} />
    </div>
    <div className="analysis-grid analysis-grid--2">
      <Tile id="ventas-tendencia" title="Ventas por día" subtitle="agregación diaria" exportRows={asRows(data?.tendencia ?? [])} empty={data?.tendencia.length === 0} {...state}>{data ? <LineAreaChart data={data.tendencia.map((point) => ({ label: point.fecha, value: point.ventas }))} /> : null}</Tile>
      <Tile id="ventas-horario" title="Ventas por periodo / horario" subtitle="23% mañana · 35% tarde · 42% noche" exportRows={asRows(data?.horarios ?? [])} empty={data?.horarios.length === 0} {...state}>{data ? <BarChart moneyValues={false} data={data.horarios.map((item, index) => ({ label: labelTime(item.label), value: item.porcentaje, color: tones[index] }))} /> : null}</Tile>
    </div>
    <div className="analysis-grid analysis-grid--2-1">
      <Tile id="ventas-productos" title="Ventas por producto" subtitle="top 8 productos · soles" exportRows={asRows(data?.productos ?? [])} empty={data?.productos.length === 0} {...state}>{data ? <HorizontalBarChart data={data.productos.slice(0, 8).map((item, index) => ({ label: item.producto, value: item.ventas, color: index === 0 ? tones[0] : index < 3 ? tones[4] : "#4c5a6b" }))} /> : null}</Tile>
      <Tile id="ventas-categorias" title="Margen por categoría" subtitle="ventas y rentabilidad" exportRows={asRows(data?.categorias ?? [])} empty={data?.categorias.length === 0} {...state}>{data ? <DivergingBars data={data.categorias.map((item) => ({ label: item.categoria, value: item.margen }))} /> : null}</Tile>
    </div>
  </div>;
}

export function PromotionsPage() {
  const { filters } = useDashboardFilters();
  const query = useQuery({ queryKey: ["tambo", "promotions", ...filtersKey(filters)], queryFn: ({ signal }) => getPromotions(filters, signal) });
  const data = query.data;
  const state = { loading: query.isLoading, error: query.error, onRetry: query.refetch, onRefresh: query.refetch };
  const negativeCount = data?.formatos.filter((item) => item.margen < 0).length ?? 0;
  return <div className="page-stack promotions-page">
    <div className="analysis-grid analysis-grid--2 promotions-page__charts">
      <Tile id="promo-ventas-formato" title="Ventas por formato" subtitle="volumen en soles" exportRows={asRows(data?.formatos ?? [])} empty={data?.formatos.length === 0} {...state}>{data ? <BarChart height={238} data={data.formatos.map((item, index) => ({ label: item.formato, value: item.ventas, color: tones[index] }))} /> : null}</Tile>
      <Tile id="promo-margen-formato" title="Margen por formato" subtitle="utilidad en soles · alerta en negativos" badge={negativeCount ? <span className="status-badge status-badge--danger"><AlertTriangle size={11} />{negativeCount} ALERTA{negativeCount === 1 ? "" : "S"}</span> : undefined} exportRows={asRows(data?.formatos ?? [])} empty={data?.formatos.length === 0} {...state}>{data ? <DivergingColumnChart height={238} data={data.formatos.map((item, index) => ({ label: item.formato, value: item.margen, color: tones[index] }))} /> : null}</Tile>
    </div>
    <Tile id="promo-detalle" title="Drill-down por subcategoría y marca" subtitle={`detalle de promociones · ${number(data?.detalle.length)} registros`} exportRows={asRows(data?.detalle ?? [])} empty={data?.detalle.length === 0} {...state}>{data ? <DataTable columns={[{ key: "promocion", label: "Promoción" }, { key: "formato", label: "Formato" }, { key: "categoria", label: "Categoría" }, { key: "marca", label: "Marca" }, { key: "transacciones", label: "Tx", format: (value) => number(Number(value)) }, { key: "ventas", label: "Ventas", format: (value) => money(Number(value)) }, { key: "margen_porcentaje", label: "Margen %", format: (value) => <span className={Number(value) < 0 ? "metric-negative" : "metric-positive"}>{formatPercentSigned(Number(value))}</span> }]} rows={asRows(data.detalle)} /> : null}</Tile>
  </div>;
}

export function CustomersPage() {
  const { filters } = useDashboardFilters();
  const query = useQuery({ queryKey: ["tambo", "customers", ...filtersKey(filters)], queryFn: ({ signal }) => getCustomers(filters, signal) });
  const data = query.data;
  const state = { loading: query.isLoading, error: query.error, onRetry: query.refetch, onRefresh: query.refetch };
  const segment = data?.segmento1825;
  const ages = data?.edades ?? [];
  const dominantAge = [...ages].sort((a, b) => b.porcentaje - a.porcentaje)[0];
  const genders = data?.generos ?? [];
  const frequency = data?.frecuenciaUso ?? [];
  return <div className="page-stack customers-page">
    <div className="analysis-grid analysis-grid--2 customers-page__top">
      <Tile id="clientes-edades" title="Distribución por edad" subtitle="% de la muestra · segmento objetivo resaltado" exportRows={asRows(ages)} empty={ages.length === 0} {...state}>{data ? <HorizontalBarChart moneyValues={false} data={ages.map((item) => ({ label: formatAgeRange(item.label), value: item.porcentaje, color: item.label === dominantAge?.label ? tones[0] : "#566477" }))} /> : null}</Tile>
      <Tile id="clientes-genero" title="Distribución por género" subtitle="% de la muestra" exportRows={asRows(genders)} empty={genders.length === 0} {...state}>{data ? <DonutChart data={genders.map((item, index) => ({ label: item.label, value: item.porcentaje, color: index === 0 ? tones[0] : "#91a0b5" }))} centerLabel="Muestra" centerFormatter={() => `n=${number(data.kpis.respuestas)}`} valueFormatter={(value) => `${number(value, 1)}%`} labelFirst /> : null}</Tile>
      <Tile id="clientes-frecuencia" title="Frecuencia de uso de promociones" subtitle={`histograma · escala 0–3 · n=${number(segment?.n)}`} exportRows={asRows(frequency)} empty={frequency.length === 0} {...state}>{data ? <BarChart height={200} moneyValues={false} data={frequency.map((item) => ({ label: String(item.nivel), value: item.respuestas, color: item.nivel >= 2 ? tones[0] : "#91a0b5" }))} /> : null}</Tile>
      <Tile id="clientes-percepciones" title="Percepciones clave" subtitle="respuestas afirmativas" exportRows={segment ? [{ identifica: segment.identifica_porcentaje, ahorro: segment.ahorro_porcentaje, preferencia_2x1: segment.prefiere_2x1_porcentaje }] : []} empty={!segment?.n} {...state}>{segment ? <PerceptionBars data={[{ label: "Identifica con facilidad las promociones", value: segment.identifica_porcentaje }, { label: "Percibe ahorro real", value: segment.ahorro_porcentaje }, { label: "Prefiere combos / 2×1", value: segment.prefiere_2x1_porcentaje }]} /> : null}</Tile>
    </div>
    <Tile id="clientes-segmento" title="Estadísticos descriptivos del segmento" subtitle={`muestra objetivo 18–25 años · n=${number(segment?.n)}`} exportRows={segment ? [{ ...segment }] : []} empty={!segment?.n} {...state}>
      {segment ? <CustomerStatisticsTable segment={segment} /> : null}
    </Tile>
  </div>;
}

export function PredictivePage() {
  const { filters } = useDashboardFilters();
  const query = useQuery({ queryKey: ["tambo", "predictive", ...filtersKey(filters)], queryFn: ({ signal }) => getPredictive(filters, signal) });
  const data = query.data;
  const state = { loading: query.isLoading, error: query.error, onRetry: query.refetch, onRefresh: query.refetch };
  return <div className="page-stack predictive-page">
    <div className="kpi-grid predictive-kpis">
      <KpiCard id="modelo-r2" label="R²" value={data?.metricas.r2 == null ? "—" : number(data.metricas.r2, 3)} animatedValue={data?.metricas.r2} valueFormatter={(value) => number(value, 3)} detail="bondad de ajuste" badge={false} exportRows={data ? [{ r2: data.metricas.r2, n: data.metricas.n }] : []} {...state} />
      <KpiCard id="modelo-mae" label="MAE" value={data?.metricas.mae == null ? "—" : money(data.metricas.mae)} animatedValue={data?.metricas.mae} valueFormatter={(value) => money(value)} detail="error absoluto medio" badge={false} tone="teal" exportRows={data ? [{ mae: data.metricas.mae }] : []} {...state} />
      <KpiCard id="modelo-rmse" label="RMSE" value={data?.metricas.rmse == null ? "—" : money(data.metricas.rmse)} animatedValue={data?.metricas.rmse} valueFormatter={(value) => money(value)} detail="raíz del error cuadrático" badge={false} tone="violet" exportRows={data ? [{ rmse: data.metricas.rmse }] : []} {...state} />
      <KpiCard id="modelo-split" label="n" value={data ? `${data.modelo.entrenamiento} / ${data.modelo.prueba}` : "—"} detail="entrenamiento / prueba" badge={false} tone="teal" exportRows={data ? [{ entrenamiento: data.modelo.entrenamiento, prueba: data.modelo.prueba }] : []} {...state} />
    </div>
    <div className="analysis-grid analysis-grid--predictive">
      <Tile id="modelo-scatter" title="Venta real vs. proyectada" subtitle={`conjunto de prueba · n=${number(data?.metricas.n)}`} exportRows={asRows(data?.predicciones ?? [])} empty={data?.predicciones.length === 0} {...state}>{data ? <ScatterPlot data={data.predicciones.map((point) => ({ id: point.idVenta, real: point.real, projected: point.proyectada }))} /> : null}</Tile>
      <Tile id="modelo-coeficientes" title="Variables predictoras" subtitle="coeficientes estandarizados" exportRows={asRows(data?.coeficientes ?? [])} empty={data?.coeficientes.length === 0} {...state}>{data ? <PredictorBars data={data.coeficientes} /> : null}</Tile>
    </div>
    <Tile id="modelo-ecuacion" title="Modelo de regresión lineal múltiple" subtitle="ecuación estimada" exportRows={asRows(data?.coeficientes ?? [])} empty={data?.coeficientes.length === 0} {...state}>{data ? <div className="equation-panel"><div className="equation"><span>Y = {number(data.modelo.intercepto, 2)}</span>{data.coeficientes.map((item, index) => <span key={item.variable}>{formatSigned(item.coeficiente_original)}·X<sub>{index + 1}</sub></span>)}</div><div className="equation-legend"><b>Y</b><span>= total_venta</span>{data.coeficientes.map((item, index) => <span key={item.variable}><b>X<sub>{index + 1}</sub></b> = {variableLabel(item.variable)}</span>)}</div></div> : null}</Tile>
  </div>;
}

export function PowerBiPage() {
  const envUrl = import.meta.env.VITE_POWER_BI_EMBED_URL?.trim() ?? "";
  const [savedUrl, setSavedUrl] = useState(() => envUrl || window.localStorage.getItem("tambo-power-bi-url") || "");
  const [draftUrl, setDraftUrl] = useState(savedUrl);
  const [invalid, setInvalid] = useState(false);
  const validUrl = validatePowerBiUrl(savedUrl);
  useEffect(() => setDraftUrl(savedUrl), [savedUrl]);
  const connect = (event: React.FormEvent) => {
    event.preventDefault();
    const next = validatePowerBiUrl(draftUrl);
    if (!next) { setInvalid(true); return; }
    window.localStorage.setItem("tambo-power-bi-url", next);
    setSavedUrl(next);
    setInvalid(false);
  };
  return <Tile id="power-bi" title="Tablero Power BI" subtitle="contenedor 16:9 · listo para embeber" exportRows={[]} badge={validUrl ? <span className="status-badge status-badge--success">Configurado</span> : undefined}>
    {validUrl ? <div className="powerbi-frame"><iframe title="Dashboard Power BI Tambo" src={validUrl} allowFullScreen /></div> : <div className={`powerbi-placeholder ${invalid ? "powerbi-placeholder--error" : ""}`}><div className="powerbi-icon"><BarChart3 size={32} /></div><strong>{invalid ? "La URL ingresada no es válida" : "Aún no hay un tablero conectado"}</strong><p>{invalid ? "Usa un enlace HTTPS publicado desde app.powerbi.com." : "Pega la URL de publicación de Power BI para incrustar el informe interactivo. El contenedor mantiene la proporción 16:9 en cualquier pantalla."}</p><form className="powerbi-connect" onSubmit={connect}><label><span className="sr-only">URL pública de Power BI</span><input type="url" value={draftUrl} onChange={(event) => { setDraftUrl(event.target.value); setInvalid(false); }} placeholder="https://app.powerbi.com/view?r=…" /></label><button type="submit">Conectar</button></form></div>}
  </Tile>;
}

export function ModelPage() {
  return <div className="page-stack model-page">
    <Tile id="modelo-dimensional" title="Modelo dimensional — esquema copo de nieve" subtitle="Hecho_Ventas + dimensiones normalizadas · pasa el cursor para resaltar relaciones" className="model-diagram-tile">
      <SnowflakeDiagram />
    </Tile>
    <div className="document-grid document-grid--3 model-summary"><InfoCard label="Tabla de hechos" value="Hecho_Ventas" text="5 medidas: cantidad, total, costo, descuento y margen. Grano: una línea de venta." /><InfoCard label="Dimensiones" value="5 dimensiones" text="Producto, Tienda, Promoción, Cliente y Tiempo enlazadas por claves foráneas." /><InfoCard label="Normalización" value="8 subdimensiones" text="Copo de nieve: jerarquías Categoría, Ciudad, Tipo, Campaña y Segmento normalizadas." /></div>
  </div>;
}

export function ArchitecturePage() {
  return <DocumentPage eyebrow="Arquitectura" title="Del origen a la decisión" lead="Una arquitectura académica reproducible: datos sintéticos, transformación SQL, DataMart analítico y una aplicación web consumiendo RPC seguras.">
    <div className="architecture-flow">
      <FlowStep number="01" icon={<Database />} title="Fuentes" text="Ventas simuladas y encuesta de 50 clientes." />
      <ArrowRight />
      <FlowStep number="02" icon={<Workflow />} title="ETL y limpieza" text="Estandarización, validaciones y reglas determinísticas." />
      <ArrowRight />
      <FlowStep number="03" icon={<Layers3 />} title="DataMart" text="Copo de nieve en PostgreSQL con vistas analíticas." />
      <ArrowRight />
      <FlowStep number="04" icon={<BarChart3 />} title="Consumo BI" text="React, Supabase Data API y contenedor Power BI." />
    </div>
    <div className="document-grid document-grid--3"><InfoCard label="Extract" value="Fuentes controladas" text="Encuesta sintética de 50 clientes, ventas determinísticas y catálogo de productos." /><InfoCard label="Transform" value="Limpieza y reglas" text="Tipificación, cálculo de margen, validaciones y normalización a claves dimensionales." /><InfoCard label="Load" value="PostgreSQL / Supabase" text="Carga reproducible al DataMart y exposición analítica mediante vistas y RPC de solo lectura." /></div>
    <SqlBlock />
  </DocumentPage>;
}

export function HefestoPage() {
  const location = useLocation();
  const phases = [
    ["01", "Análisis de requerimientos", "Preguntas del negocio, indicadores y perspectivas."],
    ["02", "Análisis de los OLTP", "Identificación de fuentes, campos y correspondencias."],
    ["03", "Modelo lógico del DataMart", "Hecho, dimensiones, jerarquías y granularidad."],
    ["04", "Procesos ETL", "Extracción, limpieza, carga y validación de cifras."],
    ["05", "Visualización y validación", "Dashboard React, integración Power BI, filtros, pruebas y comunicación de hallazgos."],
  ];
  return <DocumentPage eyebrow="Metodología" title="Hefesto aplicado al caso Tambo" lead="Las decisiones del tablero se trazan desde las preguntas de negocio hasta la carga reproducible del DataMart.">
    <div className="timeline">{phases.map(([step, title, text]) => <div className="timeline-item" key={step}><span>{step}</span><div><strong>{title}</strong><p>{text}</p></div><BadgeCheck /></div>)}</div>
    <div className="document-callout"><Sparkles /><div><strong>Resultado verificable</strong><p>El script SQL detiene la ejecución si las 100 ventas, 50 encuestas o métricas de defensa no coinciden exactamente.</p></div></div>
    <Link className="document-cta" to={{ pathname: "/power-bi", search: location.search }}><BarChart3 size={18} /><span><strong>Ver la fase de visualización</strong><small>Abrir Dashboard Power BI conservando los filtros</small></span><ArrowRight size={18} /></Link>
  </DocumentPage>;
}

export function GovernancePage() {
  const controls = [
    ["Calidad", "Restricciones, limpieza y pruebas automáticas para montos, fechas y relaciones."],
    ["Seguridad", "RLS activa, tablas internas sin lectura pública y RPC analíticas con permisos explícitos."],
    ["Trazabilidad", "SQL, modelo predictivo y configuración de despliegue versionados en Git."],
    ["Privacidad", "Clientes sintéticos y anónimos, sin nombres, documentos, correos ni teléfonos."],
  ];
  return <DocumentPage eyebrow="Gobierno de datos" title="Controles para un dato confiable" lead="El proyecto combina integridad académica, acceso de mínimo privilegio y evidencia reproducible para cada indicador.">
    <div className="governance-grid">{controls.map(([title, text], index) => <div className="governance-card" key={title}><span>0{index + 1}</span><ShieldCheck /><strong>{title}</strong><p>{text}</p></div>)}</div>
    <div className="document-grid document-grid--3"><InfoCard label="Ventas" value="100" text="Transacciones determinísticas." /><InfoCard label="Encuestas" value="50" text="Respuestas sintéticas anonimizadas." /><InfoCard label="Acceso público" value="Solo RPC aprobadas" text="Sin SELECT directo sobre tablas o vistas internas." /></div>
    <div className="legal-note"><ShieldCheck size={18} /><p><strong>Marco normativo de referencia:</strong> Ley N.° 29733 – Ley de Protección de Datos Personales y su Reglamento, D.S. N.° 003-2013-JUS. El proyecto utiliza exclusivamente datos sintéticos y anónimos.</p></div>
  </DocumentPage>;
}

export function DataDictionaryPage() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Todos");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return dataDictionary.filter((table) => {
      const groupMatches = group === "Todos" || table.group === group;
      const termMatches = !term || table.name.includes(term) || table.purpose.toLowerCase().includes(term) || table.columns.some((column) => `${column.name} ${column.description}`.toLowerCase().includes(term));
      return groupMatches && termMatches;
    });
  }, [group, query]);

  return <DocumentPage eyebrow="Metadatos · 18 tablas físicas" title="Diccionario de datos" lead="Definiciones trazables al script SQL del proyecto. Distingue el núcleo comercial, la encuesta independiente y las tablas de validación técnica.">
    <div className="dictionary-toolbar">
      <label><Search size={16} /><span className="sr-only">Buscar en el diccionario</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tabla, columna o definición" /></label>
      <label><span>Grupo</span><select value={group} onChange={(event) => setGroup(event.target.value)}><option>Todos</option><option>Modelo comercial</option><option>Encuesta</option><option>Modelo analítico</option></select></label>
      <strong>{filtered.length} de {dataDictionary.length} tablas</strong>
    </div>
    <div className="dictionary-list">
      {filtered.map((table) => <section className="dictionary-table" key={table.name}>
        <header><div><span>{table.group}</span><h3>{table.name}</h3><p>{table.purpose}</p></div><b>{table.columns.length} columnas</b></header>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Columna</th><th>Tipo</th><th>Clave</th><th>Nulable</th><th>Definición</th></tr></thead><tbody>{table.columns.map((column) => <tr key={column.name}><td><code>{column.name}</code></td><td>{column.type}</td><td>{column.key ?? "—"}</td><td>{column.nullable ? "Sí" : "No"}</td><td>{column.description}</td></tr>)}</tbody></table></div>
      </section>)}
      {!filtered.length ? <div className="state-message"><strong>Sin coincidencias</strong><span>Prueba otro término o selecciona todos los grupos.</span></div> : null}
    </div>
  </DocumentPage>;
}

export function TeamPage() {
  const members = [
    ["Chávez Díaz Víctor Jesús", "Analista BI", "CV"],
    ["Flores Mamani Jorge", "Analista BI", "FJ"],
    ["Loayza Ortega Jheisson", "Analista BI", "LJ"],
    ["Mendoza Ventura Emerson Junior", "Analista BI", "ME"],
    ["Salazar Tarazona Génesis Alexandra", "Analista BI", "SG"],
    ["Yaranga Guevara Mayra Joselyn", "Analista BI", "YM"],
  ];
  return <DocumentPage eyebrow="UTP · Grupo 06 · 2026" title="Equipo del proyecto" lead="Implementación de un DataMart para mejorar las promociones comerciales en Tambo — Sede UC.">
    <div className="team-grid">{members.map(([name, role, initials]) => <div className="team-card" key={name}><div className="team-avatar"><span>{initials}</span></div><strong>{name}</strong><p>{role}</p></div>)}</div>
    <div className="document-callout document-callout--center"><BadgeCheck /><div><strong>Docente: Núñez Huerta, José Adrián</strong><p>Inteligencia de Negocios · UTP · Grupo 06</p></div></div>
  </DocumentPage>;
}

function DocumentPage({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead: string; children: React.ReactNode }) {
  return <div className="document-page"><header><span>{eyebrow}</span><h2>{title}</h2><p>{lead}</p></header>{children}</div>;
}

function SchemaNode({ icon, title, detail, tone = "default", featured = false }: { icon?: React.ReactNode; title: string; detail: string; tone?: string; featured?: boolean }) {
  return <div className={`schema-node schema-node--${tone} ${featured ? "schema-node--featured" : ""}`}>{icon}<strong>{title}</strong><span>{detail}</span></div>;
}

function FlowStep({ number: step, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return <div className="flow-step"><span>{step}</span>{icon}<strong>{title}</strong><p>{text}</p></div>;
}

function InfoCard({ label, value, text }: { label: string; value: string; text: string }) {
  return <div className="info-card"><span>{label}</span><strong>{value}</strong><p>{text}</p></div>;
}

function SqlBlock() {
  const sql = `-- Vista analítica real del DataMart: margen por formato
CREATE VIEW public.v_margen_por_formato
WITH (security_invoker = true) AS
SELECT
  formato_promocion AS formato,
  ROUND(SUM(total_venta), 2) AS ventas,
  ROUND(SUM(margen_ganancia), 2) AS margen,
  ROUND(100 * SUM(margen_ganancia)
    / NULLIF(SUM(total_venta), 0), 1) AS margen_porcentaje
FROM public.v_ventas_limpio
GROUP BY formato_promocion;`;
  return <section className="sql-panel" aria-label="SQL de la vista de margen por formato">
    <header><i /><i /><i /><span>v_margen_por_formato.sql</span></header>
    <pre><code>{sql.split("\n").map((line, index) => <span className={line.trim().startsWith("--") ? "sql-comment" : ""} key={`${line}-${index}`}>{highlightSql(line)}{"\n"}</span>)}</code></pre>
  </section>;
}

function highlightSql(line: string) {
  const tokens = line.split(/(\b(?:CREATE|VIEW|WITH|AS|SELECT|ROUND|SUM|NULLIF|FROM|GROUP|BY|true)\b|\b\d+(?:\.\d+)?\b)/gi);
  return tokens.map((token, index) => {
    const keyword = /^(CREATE|VIEW|WITH|AS|SELECT|FROM|GROUP|BY)$/i.test(token);
    const fn = /^(ROUND|SUM|NULLIF)$/i.test(token);
    const literal = /^(true|\d+(?:\.\d+)?)$/i.test(token);
    return <span className={keyword ? "sql-keyword" : fn ? "sql-function" : literal ? "sql-literal" : undefined} key={`${token}-${index}`}>{token}</span>;
  });
}

function DataTable({ rows, columns }: { rows: Record<string, unknown>[]; columns: Array<{ key: string; label: string; format?: (value: unknown, row: Record<string, unknown>) => React.ReactNode }> }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id_promocion ?? row.id_producto ?? index)}>{columns.map((column) => <td key={column.key}>{column.format ? column.format(row[column.key], row) : String(row[column.key] ?? "—")}</td>)}</tr>)}</tbody></table></div>;
}

function PerceptionBars({ data }: { data: Array<{ label: string; value: number }> }) {
  return <div className="perception-bars">{data.map((item, index) => <div className="perception-row" style={{ "--row-delay": `${index * 90}ms` } as React.CSSProperties} key={item.label}><div><span>{item.label}</span><b>{number(item.value, 1)}%</b></div><div className="perception-track"><i style={{ width: `${Math.min(100, item.value)}%` }} /></div></div>)}</div>;
}

function CustomerStatisticsTable({ segment }: { segment: CustomersData["segmento1825"] }) {
  const rows = [
    { label: "Frecuencia de visita semanal", scale: "0–3", mean: segment.visita_media, sd: segment.visita_de },
    { label: "Aprovechamiento de promociones", scale: "0–3", mean: segment.aprovechamiento_media, sd: segment.aprovechamiento_de },
    { label: "Percepción de atractivo", scale: "1–3", mean: segment.atractivo_media, sd: segment.atractivo_de },
    { label: "Satisfacción con promociones", scale: "1–3", mean: segment.satisfaccion_media, sd: segment.satisfaccion_de },
  ];
  return <div className="table-scroll"><table className="data-table statistics-table"><thead><tr><th>Variable</th><th>Escala</th><th>Media</th><th>Desv. est.</th><th>Distribución</th></tr></thead><tbody>{rows.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.scale}</td><td>{number(row.mean, 2)}</td><td>{number(row.sd, 2)}</td><td><div className="distribution-track"><i style={{ width: `${Math.min(100, row.mean / 3 * 100)}%` }} /></div></td></tr>)}</tbody></table></div>;
}

function PredictorBars({ data }: { data: PredictiveData["coeficientes"] }) {
  const max = Math.max(...data.map((item) => Math.abs(item.coeficiente_estandarizado)), 1);
  return <div className="predictor-bars">{data.map((item, index) => {
    const value = item.coeficiente_estandarizado;
    return <div className="predictor-row" style={{ "--row-delay": `${index * 70}ms` } as React.CSSProperties} key={item.variable}><b>X<sub>{index + 1}</sub></b><span>{variableLabel(item.variable)}</span><div><i className={value < 0 ? "predictor-negative" : ""} style={{ width: `${Math.max(4, Math.abs(value) / max * 100)}%` }} /></div><strong>{value < 0 ? "−" : "+"}{number(Math.abs(value), 2)}</strong></div>;
  })}</div>;
}

function Descriptive({ label, mean, sd }: { label: string; mean: number; sd: number }) {
  return <div className="descriptive-card"><span>{label}</span><strong>{number(mean, 2)}</strong><small>DE {number(sd, 2)}</small></div>;
}

function PercentStat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return <div className={`descriptive-card descriptive-card--percent ${highlight ? "descriptive-card--highlight" : ""}`}><span>{label}</span><strong>{number(value, 0)}%</strong><div className="mini-progress"><i style={{ width: `${Math.min(100, value)}%` }} /></div></div>;
}

function labelTime(value: string) {
  const labels: Record<string, string> = { manana: "Mañana", tarde: "Tarde", noche: "Noche" };
  return labels[value.toLowerCase()] ?? value;
}

function variableLabel(variable: string) {
  const labels: Record<string, string> = { porcentaje_descuento: "% de descuento", tipo_promocion_codigo: "Tipo de promoción", codigo_tipo_promocion: "Tipo de promoción", categoria_codigo: "Categoría", codigo_categoria: "Categoría", es_fin_semana: "Temporalidad", franja_horaria_codigo: "Franja horaria", codigo_franja_horaria: "Franja horaria", edad_cliente: "Edad del cliente" };
  return labels[variable] ?? variable;
}

function variableSymbol(variable: string) {
  const symbols: Record<string, string> = { porcentaje_descuento: "descuento", tipo_promocion_codigo: "tipo_promo", categoria_codigo: "categoría", es_fin_semana: "fin_semana", franja_horaria_codigo: "horario", edad_cliente: "edad" };
  return symbols[variable] ?? variable;
}

function formatSigned(value: number) {
  return `${value < 0 ? "−" : "+"} ${number(Math.abs(value), 4)}`;
}

function formatPercentSigned(value: number) {
  return `${value > 0 ? "+" : ""}${number(value, 1)}%`;
}

function formatAgeRange(value: string) {
  return value.replace(/\s*a\s*|\s*-\s*/i, "–").replace(/\s*años$/i, "");
}

function validatePowerBiUrl(value: string) {
  if (!value.trim()) return "";
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" && parsed.hostname === "app.powerbi.com" ? parsed.toString() : "";
  } catch {
    return "";
  }
}
