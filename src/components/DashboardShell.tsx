import { useEffect, useState, type ReactNode } from "react";
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
  BookOpenText,
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
      { id: "diccionario", label: "Diccionario de datos", icon: BookOpenText },
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
  diccionario: ["Documentación", "Diccionario de datos"],
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
      <aside id="dashboard-navigation" className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`} aria-label="Navegación principal">
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
            <button className="icon-button mobile-menu" type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir navegación" aria-expanded={mobileOpen} aria-controls="dashboard-navigation"><Menu size={19} /></button>
            <button className="icon-button collapsed-menu" type="button" onClick={() => setCollapsed(false)} aria-label="Expandir navegación"><PanelLeftOpen size={19} /></button>
            <div><span>{kicker}</span><h1>{title}</h1></div>
          </div>
          <div className="topbar__spacer" />
          <GlobalFilters />
          {fetching ? <span className="sync-indicator"><i />Actualizando</span> : null}
        </header>
        <main className="canvas"><div className="canvas__inner"><div className="route-stage" key={location.pathname}>{children}</div></div></main>
      </div>
    </div>
  );
}

function GlobalFilters() {
  const { filters, setFilter, setDateRange, clearFilters, activeCount } = useDashboardFilters();
  const [dateOpen, setDateOpen] = useState(false);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["tambo", "filters"],
    queryFn: ({ signal }) => getFilterOptions(signal),
  });
  const period = query.data ? `${shortDate(query.data.fechaMin)} – ${shortDate(query.data.fechaMax)}` : "01 – 30 Jun 2026";
  const dateLabel = filters.fechaDesde || filters.fechaHasta
    ? `${filters.fechaDesde ? shortDate(filters.fechaDesde) : "Inicio"} – ${filters.fechaHasta ? shortDate(filters.fechaHasta) : "Fin"}`
    : "Últimos 30 días";

  useEffect(() => {
    if (!dateOpen && !openFilter) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDateOpen(false);
        setOpenFilter(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [dateOpen, openFilter]);

  const filterProps = (label: string) => ({
    label,
    open: openFilter === label,
    onToggle: () => {
      setDateOpen(false);
      setOpenFilter((current) => current === label ? null : label);
    },
    onClose: () => setOpenFilter(null),
  });

  return (
    <div className="filters" aria-label="Filtros globales">
      <FilterSelect {...filterProps("Tienda")} value={filters.tiendaId} options={query.data?.tiendas ?? []} disabled={query.isLoading || query.isError} onChange={(value) => setFilter("tiendaId", value)} />
      <FilterSelect {...filterProps("Categoría")} value={filters.categoriaId} options={query.data?.categorias ?? []} disabled={query.isLoading || query.isError} onChange={(value) => setFilter("categoriaId", value)} />
      <FilterSelect {...filterProps("Campaña")} value={filters.campaniaId} options={query.data?.campanias ?? []} disabled={query.isLoading || query.isError} onChange={(value) => setFilter("campaniaId", value)} />
      <FilterSelect {...filterProps("Cliente")} value={filters.tipoClienteId} options={query.data?.tiposCliente ?? []} disabled={query.isLoading || query.isError} onChange={(value) => setFilter("tipoClienteId", value)} />
      <div className="date-filter">
        <button className={`filter-chip ${filters.fechaDesde || filters.fechaHasta ? "filter-chip--active" : ""}`} type="button" onClick={() => { setOpenFilter(null); setDateOpen((open) => !open); }} aria-expanded={dateOpen} aria-controls="date-filter-popover" aria-haspopup="dialog">
          <span>Rango</span><b>{dateLabel}</b><ChevronDown size={14} />
        </button>
        {dateOpen ? (
          <>
            <button className="menu-scrim" type="button" aria-label="Cerrar fechas" onClick={() => setDateOpen(false)} />
            <div id="date-filter-popover" className="date-popover" role="dialog" aria-label="Rango de fechas">
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

function FilterSelect({ label, value, options, onChange, disabled, open, onToggle, onClose }: { label: string; value: number | null; options: FilterOption[]; onChange: (value: number | null) => void; disabled?: boolean; open: boolean; onToggle: () => void; onClose: () => void }) {
  const selected = options.find((option) => option.id === value);
  const orderedOptions = label === "Tienda" ? [...options].sort((first, second) => first.id - second.id) : options;
  const displayName = (name: string) => label === "Tienda" ? name.replace(/^UC\s*[-–—·]\s*/i, "UC · ") : name;
  const listId = `filter-${label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}`;
  const choose = (nextValue: number | null) => {
    onChange(nextValue);
    onClose();
  };

  return (
    <div className="select-filter">
      <button className={`select-chip ${value != null ? "select-chip--active" : ""}`} type="button" disabled={disabled} onClick={onToggle} aria-label={`${label}: ${selected ? displayName(selected.nombre) : "Todos"}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}>
        <span>{label}</span><b>{selected ? displayName(selected.nombre) : "Todos"}</b><ChevronDown size={14} />
      </button>
      {open ? (
        <>
          <button className="menu-scrim" type="button" aria-label={`Cerrar filtro ${label}`} onClick={onClose} />
          <div id={listId} className="filter-menu" role="listbox" aria-label={`Opciones de ${label}`}>
            <button type="button" role="option" aria-selected={value == null} className={value == null ? "filter-menu__option--selected" : ""} onClick={() => choose(null)}><span>Todos</span><b>✓</b></button>
            {orderedOptions.map((option) => <button type="button" role="option" aria-selected={option.id === value} className={option.id === value ? "filter-menu__option--selected" : ""} onClick={() => choose(option.id)} key={option.id}><span>{displayName(option.nombre)}</span><b>✓</b></button>)}
          </div>
        </>
      ) : null}
    </div>
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
