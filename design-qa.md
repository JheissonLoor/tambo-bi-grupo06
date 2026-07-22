# Design QA - Tambo BI Grupo 06

## Evidencia

- Fuentes visuales:
  - `C:\Users\LENOVO\AppData\Local\Temp\codex-clipboard-6e70de57-f24b-4fdd-b264-5136acb52043.png` (Promociones, 1652 x 890 px).
  - `C:\Users\LENOVO\AppData\Local\Temp\codex-clipboard-6c2d5a54-df19-40c1-a62e-5bc6be8475d1.png` (Clientes, 1647 x 890 px).
  - `C:\Users\LENOVO\AppData\Local\Temp\codex-clipboard-966658e4-8946-461d-a30e-4e50ac8b59a3.png` (Predictivo, 1650 x 903 px).
  - `C:\Users\LENOVO\AppData\Local\Temp\codex-clipboard-bf0eefd2-671c-4fe4-9e2a-1f653b947af7.png` (Power BI, 1645 x 894 px).
  - `C:\Users\LENOVO\AppData\Local\Temp\codex-clipboard-0f3b060d-0c32-4b7f-b413-91a28df75b28.png` (Modelo, 1648 x 884 px).
- Implementación local: `http://127.0.0.1:4173`.
- Capturas de implementación:
  - `C:\Users\LENOVO\AppData\Local\Temp\tambo-qa-promociones-final.png`.
  - `C:\Users\LENOVO\AppData\Local\Temp\tambo-qa-clientes-final.png`.
  - `C:\Users\LENOVO\AppData\Local\Temp\tambo-qa-predictivo-final.png`.
  - `C:\Users\LENOVO\AppData\Local\Temp\tambo-qa-powerbi.png`.
  - `C:\Users\LENOVO\AppData\Local\Temp\tambo-qa-modelo-scrolled.png`.
- Viewport: 1650 x 900 CSS px, densidad 1, tema oscuro, escritorio y datos de Supabase cargados.
- Normalización: las referencias varían entre 1645 y 1652 px de ancho; se compararon al mismo breakpoint y escala visual 1:1, sin reescalar su contenido.

## Comparación de vista completa

Cada referencia y su implementación se abrieron juntas en el mismo pase visual. Promociones conserva las dos gráficas superiores y la tabla completa; Clientes reproduce la cuadrícula 2 x 2 y la tabla inferior; Predictivo conserva cuatro KPI, scatter dominante, panel lateral y ecuación; Power BI replica el estado claro 16:9; Modelo reproduce la selección de `Dim_Tiempo`, la conexión ámbar, el inspector y las tres tarjetas inferiores.

## Comparación focal

- Promociones: alerta, barra negativa rayada y columnas Categoría/Marca revisadas a escala completa.
- Clientes: tamaño del donut, alturas de las dos filas y arranque de la tabla ajustados contra la referencia.
- Predictivo: altura del scatter y alineación superior independiente del panel de variables verificadas tras la segunda captura.
- Modelo: se comparó además el estado desplazado para leer el inspector y `Normalización · 8 subdimensiones`.
- Power BI: se verificaron borde discontinuo, icono, copy, campo URL y CTA `Conectar`.

## Superficies de fidelidad

- Tipografía: Space Grotesk, Inter y JetBrains Mono mantienen jerarquía, peso, tracking y densidad equivalentes a las referencias.
- Espaciado y layout: sidebar de 250 px, topbar compacto, grids 2 x 2, radios de 16 px, separaciones de 16 px y proporciones de cada bloque alineadas con las capturas.
- Color: fondo navy, superficies azul-gris, ámbar, coral, teal y violeta conservados mediante tokens semánticos.
- Activos: se sustituyó el símbolo de maqueta por el wordmark real obtenido del sitio oficial de Tambo+. Lucide permanece como biblioteca de iconos; los SVG restantes son visualizaciones de datos, no sustitutos de marca.
- Copy: títulos, subtítulos, alertas, columnas y etiquetas reproducen la nomenclatura aprobada. Los valores proceden del DataMart y no se hardcodearon desde las capturas.

## Historial de iteraciones P0/P1/P2

1. P0 - La primera captura local mostraba estados de error porque faltaban las variables públicas de Supabase.
   - Corrección: se sincronizó el entorno Production de Vercel en `.env.local`, ignorado por Git, y se reinició el preview.
   - Evidencia posterior: las cinco rutas cargan datos y `agent-browser errors` no registra errores.
2. P2 - El wordmark oficial comprimía el descriptor y el control de colapso.
   - Corrección: ancho medido de 82 px, reserva lateral para el control y posicionamiento absoluto del botón.
   - Evidencia posterior: `tambo-qa-promociones-final.png` y `tambo-qa-clientes-final.png`.
3. P2 - Predictivo quedaba demasiado compacto y estiraba el panel de variables hasta la altura del scatter.
   - Corrección: scatter de 463 px, gráfico sin tope artificial de 285 px y panel lateral alineado al inicio.
   - Evidencia posterior: `tambo-qa-predictivo-final.png`.
4. P2 - La selección inicial del modelo resaltaba todas las relaciones del hecho.
   - Corrección: `Dim_Tiempo` queda seleccionado, solo su relación usa brillo ámbar y el hecho conserva su jerarquía naranja.
   - Evidencia posterior: `tambo-qa-modelo-scrolled.png`.

## Pruebas de interacción

- Las rutas Promociones, Clientes, Predictivo, Power BI y Modelo cargaron con datos o con su estado vacío previsto.
- El filtro Tienda abrió su listbox con `UC · Av. Universitaria`, `UC · Puerta 3` y `UC · Óvalo`; la selección respondió y volvió a consultar los datos.
- El modelo mantiene selección por clic/teclado y actualiza el inspector accesible.
- Power BI presenta input URL y botón Conectar; solo acepta HTTPS de `app.powerbi.com` y conserva localmente una URL válida.
- No se detectó overlay de Vite, página en blanco ni errores del navegador.

## Hallazgos finales

No quedan hallazgos P0, P1 o P2. Se aceptan como P3 intencionales las diferencias numéricas, el tercer género de la encuesta y la sexta variable predictora: provienen de los datos reales del proyecto y preservan exactitud académica frente a los valores ilustrativos de las capturas. El cambio de la marca de maqueta al wordmark magenta también es intencional y responde a la petición explícita de usar el logo verdadero.

final result: passed
