import { useRef, useState, type ReactNode } from "react";
import { Download, Expand, MoreVertical, RefreshCw, RotateCcw, TriangleAlert } from "lucide-react";
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
}: TileProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const tileRef = useRef<HTMLElement>(null);

  const inform = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(""), 2600);
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
        <button className="icon-button" type="button" aria-label={`Acciones de ${title}`} onClick={() => setMenuOpen((open) => !open)}>
          <MoreVertical size={17} />
        </button>
      </header>

      {menuOpen ? (
        <>
          <button className="menu-scrim" type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />
          <div className="tile-menu">
            <button type="button" onClick={exportData} disabled={!exportRows.length}><Download size={15} />Exportar datos</button>
            <button type="button" onClick={fullscreen}><Expand size={15} />Pantalla completa</button>
            <button type="button" onClick={refresh} disabled={!onRefresh}><RefreshCw size={15} />Actualizar</button>
          </div>
        </>
      ) : null}

      <div className="tile__body">
        {loading ? <TileSkeleton /> : error ? (
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
};

export function KpiCard({ label, value, detail, tone = "amber", ...tileProps }: KpiCardProps) {
  return (
    <Tile {...tileProps} title={label} className={`kpi-card kpi-card--${tone} ${tileProps.className ?? ""}`}>
      <div className="kpi-card__value">{value}</div>
      <div className="kpi-card__detail">{detail}</div>
      <span className="neutral-badge">Sin periodo previo</span>
    </Tile>
  );
}
