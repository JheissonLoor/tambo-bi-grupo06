# Design QA - Tambo BI Grupo 06

## Evidencia

- Fuente visual: `https://claude.ai/code/artifact/6f1fa196-5980-4f05-a4d3-fd8a7897e5c0`
- Captura de referencia: `tests/visual/reference-summary-1440x940.png`
- Implementación: `http://127.0.0.1:4173/resumen`
- Captura de implementación: `tests/visual/implementation-summary-1440x940.png`
- Viewport y estado: 1440 x 940 CSS px, `deviceScaleFactor: 1`, tema oscuro, página Resumen, filtros globales sin selección y datos cargados.
- Dimensiones: ambas capturas tienen 1440 x 940 px; no se aplicó reescalado ni normalización de densidad.

## Comparación de vista completa

La referencia y la implementación se compararon juntas en el mismo pase visual. Se conserva la estructura principal: sidebar de 250 px, encabezado con slicers, cuatro KPI cards, tendencia dominante, barras por formato, margen por categoría, hallazgo crítico y tabla de detalle. Los cambios numéricos y la geometría de los gráficos son esperados porque la implementación usa las consultas reales del DataMart y los cuatro KPIs académicos exigidos, no los mocks del artifact.

## Superficies de fidelidad

- Tipografía: Archivo para títulos, Inter para interfaz y JetBrains Mono para metadatos; pesos, jerarquía, truncado y contraste coinciden con el lenguaje del artifact.
- Espaciado y layout: ritmo de 13-15 px entre tiles, radios de 8-10 px, bordes discretos y proporciones 60/40 en el bloque analítico. No hay desborde horizontal a 1440, 1024 o 390 px.
- Color: se preservan navy oscuro, superficies azul-gris, ámbar, coral, teal y violeta mediante tokens CSS.
- Imágenes y activos: la referencia no usa fotografía ni ilustración. Los iconos se implementan con Lucide; los gráficos SVG son visualizaciones de datos requeridas, no sustitutos de activos visuales.
- Copy: navegación y páginas documentales mantienen la nomenclatura del artifact. Los textos métricos se ajustaron al contrato académico y los nombres del equipo se verificaron contra `FINAL IB_GRUPO06.pdf`.
- Estados: skeleton, sin datos, error con reintento, actualización, CSV, fullscreen con rechazo controlado y placeholder Power BI fueron implementados.

No se necesitó un recorte focal adicional: a escala 1:1, la captura completa permite leer los slicers, KPI, títulos, leyendas, iconos, bordes y el bloque de hallazgo. Los estados móviles se revisaron por separado a 390 x 844 px y la vista tablet a 1024 x 940 px.

## Historial de iteraciones P0/P1/P2

1. P2 - La primera implementación del Resumen tenía dos gráficos 50/50 y omitía margen por categoría y detalle de promociones.
   - Corrección: se restauró la jerarquía 60/40, se agregó margen por categoría, hallazgo y tabla de detalle con datos reales.
   - Evidencia posterior: `tests/visual/implementation-summary-1440x940.png`.
2. P2 - Los slicers iniciales eran oscuros y la vista tablet presentaba desborde por el contenido mínimo del hallazgo.
   - Corrección: se igualaron los controles claros de la referencia, se contuvo el scroll de filtros y el bloque inferior pasa a una columna bajo 1240 px.
   - Evidencia posterior: 1024 x 940 sin overflow y navegación/controles utilizables.
3. P2 - La tendencia tenía una sola serie y el margen se mostraba con barras divergentes.
   - Corrección: la RPC devuelve ventas con y sin promoción por fecha; se renderizan dos series y se recuperó el donut de utilidad por categoría.
   - Evidencia posterior: captura final 1440 x 940 con leyenda de ambas series y donut.

## Pruebas de interacción

- Las 11 rutas cargan sin estado de error.
- Categoría Bebidas cambió los KPI y persistió como `?categoria=1` entre Resumen y Ventas.
- Limpiar filtros restauró S/ 675.95, ticket S/ 6.76, 100 transacciones y margen S/ 110.15.
- Menú móvil abre/cierra a 390 px; la grilla KPI usa dos columnas y no desborda.
- Actualizar repite la consulta; CSV inicia la exportación; un rechazo del Fullscreen API muestra un mensaje controlado.
- Una pestaña limpia no registró errores de consola originados por la aplicación.

## Hallazgos finales

No quedan hallazgos P0, P1 o P2. Como diferencia P3 aceptada, el artifact se captura dentro del encabezado de Claude y sus valores mock no coinciden con los datos académicos; la aplicación conserva la intención visual y muestra exclusivamente cifras SQL reales.

final result: passed
