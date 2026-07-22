export type DashboardFilters = {
  tiendaId: number | null;
  categoriaId: number | null;
  campaniaId: number | null;
  tipoClienteId: number | null;
  fechaDesde: string | null;
  fechaHasta: string | null;
};

export type FilterOption = { id: number; nombre: string };

export type FilterOptions = {
  tiendas: FilterOption[];
  categorias: FilterOption[];
  campanias: FilterOption[];
  tiposCliente: FilterOption[];
  fechaMin: string;
  fechaMax: string;
};

export type LabeledValue = { label: string; value: number; margen?: number };
export type TrendPoint = { fecha: string; ventas: number; ventas_promo?: number; ventas_sin_promo?: number; margen?: number; transacciones?: number };

export type SummaryData = {
  kpis: {
    ventasPromocion: number;
    margenImporte: number;
    margenPorcentaje: number;
    incrementoPorcentaje: number;
    frecuenciaUso: number;
    aprovechamiento: number;
    transacciones: number;
    respuestas: number;
  };
  ventasPorFormato: LabeledValue[];
  tendencia: TrendPoint[];
  insight2x1: {
    preferenciaPorcentaje: number;
    margen: number;
    margenPorcentaje: number;
    margenComboPorcentaje: number;
  };
};

export type SalesData = {
  kpis: { ventas: number; transacciones: number; ticket: number; margen: number };
  tendencia: TrendPoint[];
  horarios: Array<{ label: string; transacciones: number; ventas: number; porcentaje: number }>;
  productos: Array<{ id_producto: number; producto: string; categoria: string; ventas: number; unidades: number }>;
  categorias: Array<{ id_categoria: number; categoria: string; ventas: number; margen: number; margen_porcentaje: number }>;
};

export type PromotionsData = {
  kpis: { ventas: number; margen: number; transacciones: number };
  formatos: Array<{ formato: string; transacciones: number; ventas: number; margen: number; margen_porcentaje: number }>;
  detalle: Array<{ id_promocion: number; promocion: string; formato: string; campania: string; categoria: string; marca: string; transacciones: number; ventas: number; margen: number; margen_porcentaje: number }>;
};

export type CustomersData = {
  kpis: { respuestas: number; edad_minima: number; edad_maxima: number; frecuencia_media: number };
  edades: Array<{ label: string; respuestas: number; porcentaje: number }>;
  generos: Array<{ label: string; respuestas: number; porcentaje: number }>;
  frecuenciaUso: Array<{ nivel: number; respuestas: number; porcentaje: number }>;
  formatos: Array<{ label: string; respuestas: number; porcentaje: number }>;
  horarios: Array<{ label: string; respuestas: number; porcentaje: number }>;
  segmento1825: {
    n: number;
    visita_media: number;
    visita_de: number;
    aprovechamiento_media: number;
    aprovechamiento_de: number;
    atractivo_media: number;
    atractivo_de: number;
    satisfaccion_media: number;
    satisfaccion_de: number;
    identifica_porcentaje: number;
    ahorro_porcentaje: number;
    prefiere_2x1_porcentaje: number;
  };
};

export type PredictiveData = {
  modelo: { version: string; algoritmo: string; semilla: number; entrenamiento: number; prueba: number; intercepto: number };
  metricas: { n: number; r2: number | null; mae: number | null; rmse: number | null };
  coeficientes: Array<{ variable: string; orden: number; coeficiente_original: number; coeficiente_estandarizado: number }>;
  predicciones: Array<{ idVenta: number; real: number; proyectada: number; residual: number }>;
};
