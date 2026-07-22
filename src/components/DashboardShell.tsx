import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useIsFetching, useQuery } from "@tanstack/react-query";
import { NavLink, useLocation } from "react-router-dom";
import {
  BadgePercent,
  BarChart3,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronsLeft,
  Database,
  Layers3,
  LayoutDashboard,
  Menu,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { getFilterOptions } from "../data/tamboDataService";
import { useDashboardFilters } from "../context/FiltersContext";
import type { DashboardFilters, FilterOption } from "../types/dashboard";

const navGroups: Array<{ label: string; items: Array<{ id: string; label: string; icon: LucideIcon; alert?: boolean }> }> = [
  {
    label: "ANÁLISIS",
    items: [
      { id: "resumen", label: "Resumen", icon: LayoutDashboard },
      { id: "ventas", label: "Ventas", icon: ChartNoAxesCombined },
      { id: "promociones", label: "Promociones", icon: BadgePercent, alert: true },
      { id: "clientes", label: "Clientes", icon: UsersRound },
      { id: "predictivo", label: "Predictivo", icon: Sparkles },
      { id: "power-bi", label: "Dashboard Power BI", icon: BarChart3 },
    ],
  },
  {
    label: "DOCUMENTACIÓN",
    items: [
      { id: "modelo", label: "Modelo de datos", icon: Database },
      { id: "arquitectura", label: "Arquitectura & ETL", icon: Workflow },
      { id: "hefesto", label: "Metodología Hefesto", icon: Layers3 },
      { id: "gobierno", label: "Gobierno de datos", icon: ShieldCheck },
      { id: "equipo", label: "Equipo", icon: UserRoundCheck },
    ],
  },
];
const titles: Record<string, [string, string]> = {
  resumen: ["Bloque Análisis", "Resumen ejecutivo"],
  ventas: ["Bloque Análisis", "Análisis de ventas"],
  promociones: ["Bloque Análisis", "Promociones"],
  clientes: ["Bloque Análisis", "Clientes"],
  predictivo: ["Bloque Análisis", "Modelo predictivo"],
  "power-bi": ["Bloque Análisis", "Dashboard Power BI"],
  modelo: ["Documentación", "Modelo de datos"],
  arquitectura: ["Documentación", "Arquitectura & ETL"],
  hefesto: ["Documentación", "Metodología Hefesto"],
  gobierno: ["Documentación", "Gobierno de datos"],
  equipo: ["Documentación", "Equipo"],
};

export function DashboardShell({ page, children }: { page: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [kicker, title] = titles[page] ?? titles.resumen;
  const fetching = useIsFetching({ queryKey: ["tambo"] });

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className={`app-shell ${collapsed ? "app-shell--collapsed" : ""}`}>
      {mobileOpen ? <button className="sidebar-scrim" type="button" aria-label="Cerrar navegación" onClick={() => setMobileOpen(false)} /> : null}
      <aside className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <div className="brand__mark">T+</div>
          <div className="brand__copy"><strong>Tambo+</strong><span>TABLERO · SEDE UC</span></div>
          <button className="icon-button sidebar__collapse" type="button" onClick={() => setCollapsed((value) => !value)} aria-label="Colapsar panel"><ChevronsLeft size={17} /></button>
        </div>
        <nav className="sidebar__nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group__label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.id} to={{ pathname: `/${item.id}`, search: location.search }} className={({ isActive }) => `nav-item ${isActive ? "nav-item--active" : ""}`} title={item.label}>
                    <Icon size={19} /><span>{item.label}</span>{item.alert ? <i className="nav-alert" /> : null}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar__footer">
          <span><i />SUPABASE · EN VIVO</span>
          <p>Inteligencia de Negocios · UTP<br />Grupo 06 · 2026</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar__title">
            <button className="icon-button mobile-menu" type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir navegación"><Menu size={19} /></button>
            <button className="icon-button collapsed-menu" type="button" onClick={() => setCollapsed(false)} aria-label="Expandir navegación"><PanelLeftOpen size={19} /></button>
            <div><span>{kicker}</span><h1>{title}</h1></div>
          </div>
          <div className="topbar__spacer" />
          <GlobalFilters />
          {fetching ? <span className="sync-indicator"><i />Actualizando</span> : null}
        </header>
        <main className="canvas"><div className="canvas__inner">{children}</div></main>
      </div>
    </div>
  );
}

function GlobalFilters() {
  const { filters, setFilter, setDateRange, clearFilters, activeCount } = useDashboardFilters();
  const [dateOpen, setDateOpen] = useState(false);
  const query = useQuery({
    queryKey: ["tambo", "filters"],
    queryFn: ({ signal }) => getFilterOptions(signal),
  });
  const period = query.data ? `${shortDate(query.data.fechaMin)} – ${shortDate(query.data.fechaMax)}` : "01 – 30 Jun 2026";
  const dateLabel = filters.fechaDesde || filters.fechaHasta
    ? `${filters.fechaDesde ? shortDate(filters.fechaDesde) : "Inicio"} – ${filters.fechaHasta ? shortDate(filters.fechaHasta) : "Fin"}`
    : period;

  return (
    <div className="filters" aria-label="Filtros globales">
      <FilterSelect label="Tienda" value={filters.tiendaId} options={query.data?.tiendas ?? []} disabled={query.isLoading || query.isError} onChange={(value) => setFilter("tiendaId", value)} />
      <FilterSelect label="Categoría" value={filters.categoriaId} options={query.data?.categorias ?? []} disabled={query.isLoading || query.isError} onChange={(value) => setFilter("categoriaId", value)} />
      <FilterSelect label="Campaña" value={filters.campaniaId} options={query.data?.campanias ?? []} disabled={query.isLoading || query.isError} onChange={(value) => setFilter("campaniaId", value)} />
      <FilterSelect label="Cliente" value={filters.tipoClienteId} options={query.data?.tiposCliente ?? []} disabled={query.isLoading || query.isError} onChange={(value) => setFilter("tipoClienteId", value)} />
      <div className="date-filter">
        <button className={`filter-chip ${filters.fechaDesde || filters.fechaHasta ? "filter-chip--active" : ""}`} type="button" onClick={() => setDateOpen((open) => !open)}>
          <span>Rango</span><b>{dateLabel}</b><ChevronDown size={14} />
        </button>
        {dateOpen ? (
          <>
            <button className="menu-scrim" type="button" aria-label="Cerrar fechas" onClick={() => setDateOpen(false)} />
            <div className="date-popover">
              <label>Desde<input type="date" min={query.data?.fechaMin} max={filters.fechaHasta ?? query.data?.fechaMax} value={filters.fechaDesde ?? ""} onChange={(event) => setDateRange(event.target.value || null, filters.fechaHasta)} /></label>
              <label>Hasta<input type="date" min={filters.fechaDesde ?? query.data?.fechaMin} max={query.data?.fechaMax} value={filters.fechaHasta ?? ""} onChange={(event) => setDateRange(filters.fechaDesde, event.target.value || null)} /></label>
              <button type="button" onClick={() => { setDateRange(null, null); setDateOpen(false); }}>Periodo completo</button>
            </div>
          </>
        ) : null}
      </div>
      {activeCount ? <button className="clear-filters" type="button" onClick={clearFilters}><X size={14} />Limpiar</button> : null}
      <div className="period-chip"><CalendarDays size={15} /><span>{period}</span></div>
      {query.isError ? <span className="filter-error" title={query.error.message}>Filtros no disponibles</span> : null}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange, disabled }: { label: string; value: number | null; options: FilterOption[]; onChange: (value: number | null) => void; disabled?: boolean }) {
  return (
    <label className={`select-chip ${value != null ? "select-chip--active" : ""}`}>
      <span>{label}</span>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)} disabled={disabled} aria-label={label}>
        <option value="">Todos</option>
        {options.map((option) => <option value={option.id} key={option.id}>{option.nombre}</option>)}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}

const shortDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(date).replace(".", "");
};

export const filtersKey = (filters: DashboardFilters) => [
  filters.tiendaId,
  filters.categoriaId,
  filters.campaniaId,
  filters.tipoClienteId,
  filters.fechaDesde,
  filters.fechaHasta,
];
