import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type { DashboardFilters } from "../types/dashboard";

type FiltersContextValue = {
  filters: DashboardFilters;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  clearFilters: () => void;
  activeCount: number;
};

const FiltersContext = createContext<FiltersContextValue | null>(null);

const parameterNames: Record<keyof DashboardFilters, string> = {
  tiendaId: "tienda",
  categoriaId: "categoria",
  campaniaId: "campania",
  tipoClienteId: "cliente",
  fechaDesde: "desde",
  fechaHasta: "hasta",
};

function asInteger(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}
export function FiltersProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo<DashboardFilters>(() => ({
    tiendaId: asInteger(searchParams.get("tienda")),
    categoriaId: asInteger(searchParams.get("categoria")),
    campaniaId: asInteger(searchParams.get("campania")),
    tipoClienteId: asInteger(searchParams.get("cliente")),
    fechaDesde: searchParams.get("desde"),
    fechaHasta: searchParams.get("hasta"),
  }), [searchParams]);

  const setFilter: FiltersContextValue["setFilter"] = (key, value) => {
    const next = new URLSearchParams(searchParams);
    const parameter = parameterNames[key];
    if (value == null || value === "") next.delete(parameter);
    else next.set(parameter, String(value));
    setSearchParams(next, { replace: false });
  };

  const setDateRange = (from: string | null, to: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (from) next.set("desde", from); else next.delete("desde");
    if (to) next.set("hasta", to); else next.delete("hasta");
    setSearchParams(next, { replace: false });
  };

  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: false });
  const activeCount = Object.values(filters).filter((value) => value != null && value !== "").length;

  return (
    <FiltersContext.Provider value={{ filters, setFilter, setDateRange, clearFilters, activeCount }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useDashboardFilters() {
  const value = useContext(FiltersContext);
  if (!value) throw new Error("useDashboardFilters debe usarse dentro de FiltersProvider");
  return value;
}
