import { requireSupabase } from "../lib/supabase";
import type {
  CustomersData,
  DashboardFilters,
  FilterOptions,
  PredictiveData,
  PromotionsData,
  SalesData,
  SummaryData,
} from "../types/dashboard";

type RpcName = "get_summary" | "get_sales" | "get_promotions" | "get_customers" | "get_predictive";

function params(filters: DashboardFilters) {
  return {
    p_tienda_id: filters.tiendaId,
    p_categoria_id: filters.categoriaId,
    p_campania_id: filters.campaniaId,
    p_tipo_cliente_id: filters.tipoClienteId,
    p_fecha_desde: filters.fechaDesde,
    p_fecha_hasta: filters.fechaHasta,
  };
}

async function callRpc<T>(name: RpcName, filters: DashboardFilters, signal?: AbortSignal): Promise<T> {
  const request = requireSupabase().rpc(name, params(filters));
  const { data, error } = signal ? await request.abortSignal(signal) : await request;
  if (error) throw new Error(error.message);
  if (data == null) throw new Error("Supabase no devolvió datos para esta consulta.");
  return data as T;
}

export async function getFilterOptions(signal?: AbortSignal): Promise<FilterOptions> {
  const request = requireSupabase().rpc("get_filter_options");
  const { data, error } = signal ? await request.abortSignal(signal) : await request;
  if (error) throw new Error(error.message);
  if (data == null) throw new Error("No se pudieron cargar los filtros.");
  return data as FilterOptions;
}

export const getSummary = (filters: DashboardFilters, signal?: AbortSignal) =>
  callRpc<SummaryData>("get_summary", filters, signal);

export const getSales = (filters: DashboardFilters, signal?: AbortSignal) =>
  callRpc<SalesData>("get_sales", filters, signal);

export const getPromotions = (filters: DashboardFilters, signal?: AbortSignal) =>
  callRpc<PromotionsData>("get_promotions", filters, signal);

export const getCustomers = (filters: DashboardFilters, signal?: AbortSignal) =>
  callRpc<CustomersData>("get_customers", filters, signal);

export const getPredictive = (filters: DashboardFilters, signal?: AbortSignal) =>
  callRpc<PredictiveData>("get_predictive", filters, signal);
