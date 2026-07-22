import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Download, Expand, MoreVertical, RefreshCw, RotateCcw, TriangleAlert } from "lucide-react";
import { useAnimatedNumber } from "../hooks/useDashboardMotion";
import { downloadCsv } from "../utils/format";

type TileProps = {
  id: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  onRetry?: () => void;
  onRefresh?: () => void;
  exportRows?: Array<Record<string, unknown>>;
  badge?: ReactNode;
  hideActions?: boolean;
};

export function Tile({
  id,
  title,
  subtitle,
  children,
  className = "",
  loading,
  error,
  empty,
  onRetry,
  onRefresh,
  exportRows = [],
  badge,
  hideActions = false,
}: TileProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasLoadingState = loading !== undefined;
  const [minimumLoadingVisible, setMinimumLoadingVisible] = useState(hasLoadingState);
  const tileRef = useRef<HTMLElement>(null);
  const actionTimerRef = useRef<number | undefined>(undefined);
  const loadingStartedAtRef = useRef(Date.now());
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  useEffect(() => () => window.clearTimeout(actionTimerRef.current), []);

  useEffect(() => {
    if (!hasLoadingState) return;

    if (loading) {
      loadingStartedAtRef.current = Date.now();
      setMinimumLoadingVisible(true);
      return;
    }

    const remaining = Math.max(0, 620 - (Date.now() - loadingStartedAtRef.current));
    const timeout = window.setTimeout(() => setMinimumLoadingVisible(false), remaining);
    return () => window.clearTimeout(timeout);
  }, [hasLoadingState, loading]);

  const showLoading = hasLoadingState && (Boolean(loading) || minimumLoadingVisible);

  const inform = (message: string) => {
    window.clearTimeout(actionTimerRef.current);
    setActionMessage(message);
    actionTimerRef.current = window.setTimeout(() => setActionMessage(""), 2600);
  };

  const fullscreen = async () => {
    setMenuOpen(false);
    try {
      if (!tileRef.current?.requestFullscreen) throw new Error("Fullscreen API no disponible");
      await tileRef.current.requestFullscreen();
    } catch {
      inform("El navegador no autorizó la pantalla completa.");
    }
  };

  const refresh = () => {
    setMenuOpen(false);
    onRefresh?.();
    inform("Consulta actualizada.");
  };

  const exportData = () => {
    setMenuOpen(false);
    downloadCsv(`${id}.csv`, exportRows);
    inform("Exportación CSV iniciada.");
  };

  return (
    <section ref={tileRef} className={`tile ${className}`} data-tile={id}>
      <header className="tile__header">
        <div className="tile__heading">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {badge}
        {!hideActions ? <button className="icon-button" type="button" aria-label={`Acciones de ${title}`} aria-expanded={menuOpen} aria-controls={menuId} aria-haspopup="menu" onClick={() => setMenuOpen((open) => !open)}>
          <MoreVertical size={17} />
        </button> : null}
      </header>

      {menuOpen && !hideActions ? (
        <>
          <button className="menu-scrim" type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />
          <div id={menuId} className="tile-menu" role="menu" aria-label={`Acciones de ${title}`}>
            <button role="menuitem" type="button" onClick={exportData} disabled={!exportRows.length}><Download size={15} />Exportar datos</button>
            <button role="menuitem" type="button" onClick={fullscreen}><Expand size={15} />Pantalla completa</button>
            <button role="menuitem" type="button" onClick={refresh} disabled={!onRefresh}><RefreshCw size={15} />Actualizar</button>
          </div>
        </>
      ) : null}

      <div className="tile__body">
        {showLoading ? <TileSkeleton /> : error ? (
          <div className="state-message state-message--error">
            <TriangleAlert size={23} />
            <strong>No se pudo cargar este bloque</strong>
            <span>{error.message}</span>
            {onRetry ? <button type="button" onClick={onRetry}><RotateCcw size={14} />Reintentar</button> : null}
          </div>
        ) : empty ? (
          <div className="state-message"><strong>Sin datos</strong><span>Ajusta o limpia los filtros para ver resultados.</span></div>
        ) : children}
      </div>
      {actionMessage ? <div className="tile-action-feedback" role="status">{actionMessage}</div> : null}
    </section>
  );
}

export function TileSkeleton() {
  return (
    <div className="tile-skeleton" aria-label="Cargando">
      <span /><span /><span /><span />
    </div>
  );
}

type KpiCardProps = Omit<TileProps, "children" | "title"> & {
  label: string;
  value: string;
  detail: string;
  tone?: "amber" | "coral" | "teal" | "violet";
  animatedValue?: number | null;
  valueFormatter?: (value: number) => string;
};

export function KpiCard({ label, value, detail, tone = "amber", animatedValue, valueFormatter, ...tileProps }: KpiCardProps) {
  const animated = useAnimatedNumber(animatedValue);
  const displayedValue = animated != null && valueFormatter ? valueFormatter(animated) : value;
  return (
    <Tile {...tileProps} title={label} badge={tileProps.badge ?? <span className="neutral-badge">SEDE UC</span>} hideActions className={`kpi-card kpi-card--${tone} ${tileProps.className ?? ""}`}>
      <div className="kpi-card__value" aria-label={value}><span aria-hidden="true">{displayedValue}</span></div>
      <div className="kpi-card__detail">{detail}</div>
    </Tile>
  );
}
