import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { DashboardShell } from "./components/DashboardShell";
import { FiltersProvider } from "./context/FiltersContext";
import {
  ArchitecturePage,
  CustomersPage,
  DataDictionaryPage,
  GovernancePage,
  HefestoPage,
  ModelPage,
  PowerBiPage,
  PredictivePage,
  PromotionsPage,
  SalesPage,
  SummaryPage,
  TeamPage,
} from "./pages/DashboardPages";

const pages = [
  ["resumen", SummaryPage],
  ["ventas", SalesPage],
  ["promociones", PromotionsPage],
  ["clientes", CustomersPage],
  ["predictivo", PredictivePage],
  ["power-bi", PowerBiPage],
  ["modelo", ModelPage],
  ["diccionario", DataDictionaryPage],
  ["arquitectura", ArchitecturePage],
  ["hefesto", HefestoPage],
  ["gobierno", GovernancePage],
  ["equipo", TeamPage],
] as const;

export function App() {
  return (
    <FiltersProvider>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        {pages.map(([id, Page]) => (
          <Route key={id} path={`/${id}`} element={<DashboardShell page={id}><Page /></DashboardShell>} />
        ))}
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </FiltersProvider>
  );
}

function HomeRedirect() {
  const location = useLocation();
  return <Navigate replace to={{ pathname: "/resumen", search: location.search }} />;
}
