import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, ArrowRight, BadgeCheck, BarChart3, Database, Layers3, Search, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { BarChart, DivergingBars, DonutChart, LineAreaChart, ScatterPlot } from "../components/Charts";
import { KpiCard, Tile } from "../components/Tile";
import { filtersKey } from "../components/DashboardShell";
import { useDashboardFilters } from "../context/FiltersContext";
import { getCustomers, getPredictive, getPromotions, getSales, getSummary } from "../data/tamboDataService";
import { dataDictionary } from "../data/dataDictionary";
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
        <KpiCard id="kpi-ventas-promocion" label="Ventas por promoción" value={money(data?.kpis.ventasPromocion)} detail={`${number(data?.kpis.transacciones)} transacciones filtradas`} tone="amber" exportRows={data ? [{ ventas_promocion: data.kpis.ventasPromocion }] : []} {...state} />
        <KpiCard id="kpi-margen" label="Margen de ganancia" value={`${number(data?.kpis.margenPorcentaje, 1)}%`} detail={`${money(data?.kpis.margenImporte)} acumulado`} tone="coral" exportRows={data ? [{ margen_porcentaje: data.kpis.margenPorcentaje, margen_importe: data.kpis.margenImporte }] : []} {...state} />
        <KpiCard id="kpi-incremento" label="Incremento de ventas" value={`${number(data?.kpis.incrementoPorcentaje, 1)}%`} detail="Con promoción vs. sin promoción" tone="teal" exportRows={data ? [{ incremento_porcentaje: data.kpis.incrementoPorcentaje }] : []} {...state} />
        <KpiCard id="kpi-frecuencia" label="Frecuencia declarada de uso" value={`${number(data?.kpis.frecuenciaUso, 2)} / 3`} detail={`Promedio de ${number(data?.kpis.respuestas)} respuestas · escala 0–3`} tone="violet" exportRows={data ? [{ frecuencia_uso: data.kpis.frecuenciaUso, respuestas: data.kpis.respuestas }] : []} {...state} />
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
            <div className="insight-metric insight-metric--negative"><span>Margen 2x1</span><strong>{number(data.insight2x1.margenPorcentaje, 1)}%</strong><b>{money(data.insight2x1.margen)}</b></div>
            <div className="insight-metric insight-metric--positive"><span>Margen combo</span><strong>{number(data.insight2x1.margenComboPorcentaje, 1)}%</strong><b>Alternativa rentable</b></div>
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
      <KpiCard id="ventas-total" label="Ventas totales" value={money(data?.kpis.ventas)} detail="Importe del periodo filtrado" tone="amber" exportRows={data ? [{ ventas: data.kpis.ventas }] : []} {...state} />
      <KpiCard id="ventas-ticket" label="Ticket promedio" value={money(data?.kpis.ticket)} detail="AVG(total_venta)" tone="coral" exportRows={data ? [{ ticket: data.kpis.ticket }] : []} {...state} />
      <KpiCard id="ventas-transacciones" label="Transacciones" value={number(data?.kpis.transacciones)} detail="COUNT(id_venta)" tone="teal" exportRows={data ? [{ transacciones: data.kpis.transacciones }] : []} {...state} />
      <KpiCard id="ventas-margen" label="Margen acumulado" value={money(data?.kpis.margen)} detail="Ventas menos costos" tone="violet" exportRows={data ? [{ margen: data.kpis.margen }] : []} {...state} />
    </div>
    <div className="analysis-grid analysis-grid--2">
      <Tile id="ventas-tendencia" title="Ventas por día" subtitle="agregación diaria" exportRows={asRows(data?.tendencia ?? [])} empty={data?.tendencia.length === 0} {...state}>{data ? <LineAreaChart data={data.tendencia.map((point) => ({ label: point.fecha, value: point.ventas }))} /> : null}</Tile>
      <Tile id="ventas-horario" title="Ventas por periodo / horario" subtitle="23% mañana · 35% tarde · 42% noche" exportRows={asRows(data?.horarios ?? [])} empty={data?.horarios.length === 0} {...state}>{data ? <BarChart moneyValues={false} data={data.horarios.map((item, index) => ({ label: labelTime(item.label), value: item.porcentaje, color: tones[index] }))} /> : null}</Tile>
    </div>
    <div className="analysis-grid analysis-grid--2-1">
      <Tile id="ventas-productos" title="Productos con mayor venta" subtitle="producto · categoría · unidades" exportRows={asRows(data?.productos ?? [])} empty={data?.productos.length === 0} {...state}>{data ? <DataTable columns={[{ key: "producto", label: "Producto" }, { key: "categoria", label: "Categoría" }, { key: "unidades", label: "Unid.", format: (value) => number(Number(value)) }, { key: "ventas", label: "Ventas", format: (value) => money(Number(value)) }]} rows={asRows(data.productos)} /> : null}</Tile>
      <Tile id="ventas-categorias" title="Margen por categoría" subtitle="ventas y rentabilidad" exportRows={asRows(data?.categorias ?? [])} empty={data?.categorias.length === 0} {...state}>{data ? <DivergingBars data={data.categorias.map((item) => ({ label: item.categoria, value: item.margen }))} /> : null}</Tile>
    </div>
  </div>;
}

export function PromotionsPage() {
  const { filters } = useDashboardFilters();
  const query = useQuery({ queryKey: ["tambo", "promotions", ...filtersKey(filters)], queryFn: ({ signal }) => getPromotions(filters, signal) });
  const data = query.data;
  const state = { loading: query.isLoading, error: query.error, onRetry: query.refetch, onRefresh: query.refetch };
  return <div className="page-stack">
    <div className="kpi-grid kpi-grid--3">
      <KpiCard id="promo-ventas" label="Ventas con promoción" value={money(data?.kpis.ventas)} detail="SUM(total_venta)" exportRows={data ? [{ ventas: data.kpis.ventas }] : []} {...state} />
      <KpiCard id="promo-transacciones" label="Usos de promoción" value={number(data?.kpis.transacciones)} detail="Transacciones promocionadas" tone="teal" exportRows={data ? [{ transacciones: data.kpis.transacciones }] : []} {...state} />
      <KpiCard id="promo-margen" label="Margen promocional" value={money(data?.kpis.margen)} detail="Incluye pérdidas legítimas" tone="coral" exportRows={data ? [{ margen: data.kpis.margen }] : []} {...state} />
    </div>
    <div className="analysis-grid analysis-grid--2">
      <Tile id="promo-ventas-formato" title="Ventas por formato promocional" subtitle="SUM(total_venta)" exportRows={asRows(data?.formatos ?? [])} empty={data?.formatos.length === 0} {...state}>{data ? <BarChart data={data.formatos.map((item, index) => ({ label: item.formato, value: item.ventas, color: tones[index] }))} /> : null}</Tile>
      <Tile id="promo-margen-formato" title="Margen por formato" subtitle="las pérdidas se conservan" exportRows={asRows(data?.formatos ?? [])} empty={data?.formatos.length === 0} {...state}>{data ? <DivergingBars data={data.formatos.map((item) => ({ label: item.formato, value: item.margen }))} /> : null}</Tile>
    </div>
    <Tile id="promo-detalle" title="Detalle de promociones" subtitle="8 promociones del proyecto" exportRows={asRows(data?.detalle ?? [])} empty={data?.detalle.length === 0} {...state}>{data ? <DataTable columns={[{ key: "promocion", label: "Promoción" }, { key: "formato", label: "Formato" }, { key: "campania", label: "Campaña" }, { key: "transacciones", label: "Tx", format: (value) => number(Number(value)) }, { key: "ventas", label: "Ventas", format: (value) => money(Number(value)) }, { key: "margen", label: "Margen", format: (value) => money(Number(value)) }, { key: "margen_porcentaje", label: "%", format: (value) => `${number(Number(value), 1)}%` }]} rows={asRows(data.detalle)} /> : null}</Tile>
  </div>;
}

export function CustomersPage() {
  const { filters } = useDashboardFilters();
  const query = useQuery({ queryKey: ["tambo", "customers", ...filtersKey(filters)], queryFn: ({ signal }) => getCustomers(filters, signal) });
  const data = query.data;
  const state = { loading: query.isLoading, error: query.error, onRetry: query.refetch, onRefresh: query.refetch };
  const segment = data?.segmento1825;
  const dominantAge = data ? [...data.edades].sort((a, b) => b.porcentaje - a.porcentaje)[0] : undefined;
  return <div className="page-stack">
    <div className="kpi-grid kpi-grid--3">
      <KpiCard id="clientes-respuestas" label="Respuestas" value={number(data?.kpis.respuestas)} detail="Encuestas válidas" exportRows={data ? [{ respuestas: data.kpis.respuestas }] : []} {...state} />
      <KpiCard id="clientes-rango" label="Segmento de edad dominante" value={dominantAge ? `${dominantAge.label} años` : "—"} detail={dominantAge ? `${number(dominantAge.porcentaje, 1)}% de las respuestas filtradas` : "Sin respuestas"} tone="teal" exportRows={data ? asRows(data.edades) : []} {...state} />
      <KpiCard id="clientes-frecuencia" label="Frecuencia declarada de uso" value={`${number(data?.kpis.frecuencia_media, 2)} / 3`} detail="Promedio de encuesta · escala 0–3" tone="violet" exportRows={data ? [{ frecuencia_media: data.kpis.frecuencia_media }] : []} {...state} />
    </div>
    <div className="analysis-grid analysis-grid--3">
      <Tile id="clientes-edades" title="Rangos de edad" subtitle="distribución de respuestas" exportRows={asRows(data?.edades ?? [])} empty={data?.edades.length === 0} {...state}>{data ? <DonutChart data={data.edades.map((item, index) => ({ label: item.label, value: item.respuestas, color: tones[index] }))} centerLabel="respuestas" /> : null}</Tile>
      <Tile id="clientes-formatos" title="Formato preferido" subtitle="declaración de encuesta" exportRows={asRows(data?.formatos ?? [])} empty={data?.formatos.length === 0} {...state}>{data ? <BarChart height={260} moneyValues={false} data={data.formatos.map((item, index) => ({ label: item.label, value: item.porcentaje, color: tones[index] }))} /> : null}</Tile>
      <Tile id="clientes-horarios" title="Horario preferido" subtitle="encuesta" exportRows={asRows(data?.horarios ?? [])} empty={data?.horarios.length === 0} {...state}>{data ? <DonutChart data={data.horarios.map((item, index) => ({ label: labelTime(item.label), value: item.respuestas, color: tones[index] }))} centerLabel="respuestas" /> : null}</Tile>
    </div>
    <Tile id="clientes-segmento" title="Descriptivos del segmento 18–25" subtitle={`n = ${number(segment?.n)} · media y desviación estándar`} exportRows={segment ? [{ ...segment }] : []} empty={!segment?.n} {...state}>
      {segment ? <div className="descriptive-grid"><Descriptive label="Visita semanal" mean={segment.visita_media} sd={segment.visita_de} /><Descriptive label="Aprovechamiento" mean={segment.aprovechamiento_media} sd={segment.aprovechamiento_de} /><Descriptive label="Atractivo" mean={segment.atractivo_media} sd={segment.atractivo_de} /><Descriptive label="Satisfacción" mean={segment.satisfaccion_media} sd={segment.satisfaccion_de} /><PercentStat label="Identifica promociones" value={segment.identifica_porcentaje} /><PercentStat label="Percibe ahorro" value={segment.ahorro_porcentaje} /><PercentStat label="Prefiere 2x1" value={segment.prefiere_2x1_porcentaje} highlight /></div> : null}
    </Tile>
  </div>;
}

export function PredictivePage() {
  const { filters } = useDashboardFilters();
  const query = useQuery({ queryKey: ["tambo", "predictive", ...filtersKey(filters)], queryFn: ({ signal }) => getPredictive(filters, signal) });
  const evidenceQuery = useQuery({ queryKey: ["tambo", "customers", ...filtersKey(filters)], queryFn: ({ signal }) => getCustomers(filters, signal) });
  const data = query.data;
  const segment = evidenceQuery.data?.segmento1825;
  const state = { loading: query.isLoading, error: query.error, onRetry: query.refetch, onRefresh: query.refetch };
  return <div className="page-stack">
    <div className="kpi-grid kpi-grid--3">
      <KpiCard id="modelo-r2" label="R² filtrado" value={data?.metricas.r2 == null ? "Sin variación" : number(data.metricas.r2, 3)} detail={`${number(data?.metricas.n)} predicciones visibles`} exportRows={data ? [{ r2: data.metricas.r2, n: data.metricas.n }] : []} {...state} />
      <KpiCard id="modelo-mae" label="MAE" value={data?.metricas.mae == null ? "—" : money(data.metricas.mae)} detail="Error absoluto medio" tone="teal" exportRows={data ? [{ mae: data.metricas.mae }] : []} {...state} />
      <KpiCard id="modelo-rmse" label="RMSE" value={data?.metricas.rmse == null ? "—" : money(data.metricas.rmse)} detail="Raíz del error cuadrático" tone="violet" exportRows={data ? [{ rmse: data.metricas.rmse }] : []} {...state} />
    </div>
    <div className="model-banner"><Sparkles size={22} /><div><strong>Validación técnica del pipeline · {data?.modelo.algoritmo ?? "Regresión lineal múltiple"}</strong><span>{data ? `n = 100 datos sintéticos · ${data.modelo.entrenamiento}/${data.modelo.prueba} · semilla ${data.modelo.semilla} · ${data.modelo.version}` : "Cargando versión reproducible"}</span></div></div>
    <div className="methodology-note" role="note"><AlertTriangle size={19} /><div><strong>Alcance metodológico</strong><p>Estas métricas validan que el flujo de entrenamiento, almacenamiento y visualización sea reproducible. No prueban capacidad predictiva sobre ventas reales ni deben usarse para decisiones comerciales sin datos históricos observados y validación externa.</p></div></div>
    <div className="analysis-grid analysis-grid--2">
      <Tile id="modelo-coeficientes" title="Importancia de variables" subtitle="coeficientes estandarizados" exportRows={asRows(data?.coeficientes ?? [])} empty={data?.coeficientes.length === 0} {...state}>{data ? <DivergingBars data={data.coeficientes.map((item) => ({ label: variableLabel(item.variable), value: item.coeficiente_estandarizado }))} /> : null}</Tile>
      <Tile id="modelo-scatter" title="Real frente a proyectado" subtitle="conjunto de prueba filtrado" exportRows={asRows(data?.predicciones ?? [])} empty={data?.predicciones.length === 0} {...state}>{data ? <ScatterPlot data={data.predicciones.map((point) => ({ id: point.idVenta, real: point.real, projected: point.proyectada }))} /> : null}</Tile>
    </div>
    <Tile id="modelo-ecuacion" title="Ecuación del modelo" subtitle="coeficientes originales · no estandarizados" exportRows={asRows(data?.coeficientes ?? [])} empty={data?.coeficientes.length === 0} {...state}>{data ? <div className="equation"><span>ŷ = {number(data.modelo.intercepto, 4)}</span>{data.coeficientes.map((item) => <span key={item.variable}>{formatSigned(item.coeficiente_original)} · {variableSymbol(item.variable)}</span>)}</div> : null}</Tile>
    <Tile id="modelo-evidencia-segmento" title="Evidencia exploratoria del segmento 18–25" subtitle={`encuesta sintética · n = ${number(segment?.n)} · sin inferencia causal`} exportRows={segment ? [{ ...segment }] : []} loading={evidenceQuery.isLoading} error={evidenceQuery.error} empty={!segment?.n} onRetry={evidenceQuery.refetch} onRefresh={evidenceQuery.refetch}>
      {segment ? <div className="descriptive-grid descriptive-grid--evidence"><Descriptive label="Visita semanal" mean={segment.visita_media} sd={segment.visita_de} /><Descriptive label="Aprovechamiento" mean={segment.aprovechamiento_media} sd={segment.aprovechamiento_de} /><Descriptive label="Atractivo" mean={segment.atractivo_media} sd={segment.atractivo_de} /><Descriptive label="Satisfacción" mean={segment.satisfaccion_media} sd={segment.satisfaccion_de} /><PercentStat label="Identifica promociones" value={segment.identifica_porcentaje} /><PercentStat label="Percibe ahorro" value={segment.ahorro_porcentaje} /><PercentStat label="Prefiere 2x1" value={segment.prefiere_2x1_porcentaje} highlight /></div> : null}
    </Tile>
  </div>;
}

export function PowerBiPage() {
  const raw = import.meta.env.VITE_POWER_BI_EMBED_URL?.trim() ?? "";
  let validUrl = "";
  let invalid = false;
  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" && url.hostname === "app.powerbi.com") validUrl = url.toString(); else invalid = true;
    } catch { invalid = true; }
  }
  return <Tile id="power-bi" title="Tablero Power BI" subtitle="contenedor 16:9 · configuración por entorno" exportRows={[]} badge={validUrl ? <span className="status-badge status-badge--success">Configurado</span> : undefined}>
    {validUrl ? <div className="powerbi-frame"><iframe title="Dashboard Power BI Tambo" src={validUrl} allowFullScreen /></div> : <div className={`powerbi-placeholder ${invalid ? "powerbi-placeholder--error" : ""}`}><div className="powerbi-icon"><BarChart3 size={32} /></div><strong>{invalid ? "La URL configurada no es válida" : "Aún no hay un tablero conectado"}</strong><p>{invalid ? "VITE_POWER_BI_EMBED_URL debe usar HTTPS y pertenecer a app.powerbi.com." : "Publica el informe en Power BI y configura su enlace seguro en VITE_POWER_BI_EMBED_URL. El contenedor conservará la proporción 16:9."}</p><code>VITE_POWER_BI_EMBED_URL=https://app.powerbi.com/view?r=…</code></div>}
  </Tile>;
}

export function ModelPage() {
  return <DocumentPage eyebrow="Modelo dimensional · 14 tablas comerciales" title="DataMart en copo de nieve" lead="El hecho de ventas concentra las medidas comerciales y se conecta con trece dimensiones normalizadas. La encuesta y los resultados de validación forman una extensión analítica separada.">
    <div className="model-map" aria-label="Diagrama de las 14 tablas del modelo comercial">
      <div className="model-map__fact"><SchemaNode icon={<Database />} title="Hecho_Ventas" detail="cantidad · venta · costo · descuento · margen" tone="amber" featured /></div>
      <div className="model-map__branch"><span>Producto</span><SchemaNode icon={<Layers3 />} title="Dim_Producto" detail="producto · precio" tone="teal" /><SchemaNode title="Dim_Subcategoria" detail="subcategoría" /><SchemaNode title="Dim_Categoria" detail="categoría" /><SchemaNode title="Dim_Marca" detail="marca" /></div>
      <div className="model-map__branch"><span>Ubicación</span><SchemaNode title="Dim_Tienda" detail="sede · código" /><SchemaNode title="Dim_Distrito" detail="distrito" /><SchemaNode title="Dim_Ciudad" detail="ciudad" /></div>
      <div className="model-map__branch"><span>Promoción</span><SchemaNode icon={<Layers3 />} title="Dim_Promocion" detail="promoción · vigencia" tone="coral" /><SchemaNode title="Dim_TipoPromocion" detail="formato" /><SchemaNode title="Dim_Campania" detail="campaña" /></div>
      <div className="model-map__branch"><span>Cliente</span><SchemaNode title="Dim_Cliente" detail="edad · género" /><SchemaNode title="Dim_TipoCliente" detail="segmento" /></div>
      <div className="model-map__branch"><span>Tiempo</span><SchemaNode title="Dim_Tiempo" detail="fecha · mes · trimestre" /></div>
    </div>
    <div className="analytic-extension"><div><span>Extensión analítica · 4 tablas</span><strong>Fuentes y resultados fuera del núcleo comercial</strong></div><div className="analytic-extension__nodes"><SchemaNode title="Encuesta_Clientes" detail="50 respuestas sintéticas" tone="teal" /><SchemaNode title="Modelo_Predictivo" detail="versión · métricas" tone="coral" /><SchemaNode title="Coeficiente_Modelo" detail="6 variables" /><SchemaNode title="Prediccion_Venta" detail="30 observaciones" /></div></div>
    <div className="document-grid document-grid--3"><InfoCard label="Granularidad" value="Una transacción" text="Cada fila representa una venta individual en la sede UC." /><InfoCard label="Integridad" value="100% referencial" text="Claves foráneas y restricciones preservan la consistencia." /><InfoCard label="Motor cloud" value="PostgreSQL" text="El mismo modelo académico, reproducido en Supabase." /></div>
  </DocumentPage>;
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
    <div className="document-grid document-grid--2"><InfoCard label="Seguridad" value="RPC de solo lectura" text="Las tablas y vistas internas no se exponen; anon y authenticated solo ejecutan funciones analíticas aprobadas." /><InfoCard label="Despliegue" value="Vercel" text="Frontend estático, variables por entorno, cabeceras de seguridad y navegación SPA." /></div>
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

function DataTable({ rows, columns }: { rows: Record<string, unknown>[]; columns: Array<{ key: string; label: string; format?: (value: unknown) => string }> }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id_promocion ?? row.id_producto ?? index)}>{columns.map((column) => <td key={column.key}>{column.format ? column.format(row[column.key]) : String(row[column.key] ?? "—")}</td>)}</tr>)}</tbody></table></div>;
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
  const labels: Record<string, string> = { porcentaje_descuento: "% descuento", tipo_promocion_codigo: "Tipo promoción", categoria_codigo: "Categoría", es_fin_semana: "Fin de semana", franja_horaria_codigo: "Franja horaria", edad_cliente: "Edad cliente" };
  return labels[variable] ?? variable;
}

function variableSymbol(variable: string) {
  const symbols: Record<string, string> = { porcentaje_descuento: "descuento", tipo_promocion_codigo: "tipo_promo", categoria_codigo: "categoría", es_fin_semana: "fin_semana", franja_horaria_codigo: "horario", edad_cliente: "edad" };
  return symbols[variable] ?? variable;
}

function formatSigned(value: number) {
  return `${value < 0 ? "−" : "+"} ${number(Math.abs(value), 4)}`;
}
