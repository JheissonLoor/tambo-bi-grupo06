# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable design direction

- Treat `C:\Users\LENOVO\Downloads\Tablero de Promociones Tambo+.zip` as the most detailed source of truth for layout, interaction states, animation timings, chart behavior, and motion accessibility. Use `Tablero Tambo (offline).html` and the supplied Sede UC screenshots as supporting visual references.
- Keep the product identity as `Tambo+` with the descriptor `TABLERO · SEDE UC` and use the real current Tambo+ wordmark from the official tambo.pe source; do not redraw or substitute it with a text/CSS mark.
- Preserve the dark executive visual system: compact sidebar, white filter chips with dark custom menus, 16 px dashboard cards, Space Grotesk display typography, Inter UI text, JetBrains Mono metadata, and clearly perceptible but professional motion.
- Motion is part of the product, not decoration: use the ZIP timings and behaviors for page rise, staggered cards, 950 ms KPI count-up, animated bars/lines/donuts/scatter points, hover dimming, cursor-following tooltips, pulsing alerts, and snowflake relationship drawing. Every motion must collapse to near-zero duration under `prefers-reduced-motion: reduce`.
- The data-model page must show the connected interactive snowflake schema, including the fact table, dimensions, subdimensions, relationship lines, and a field inspector; do not replace it with an unconnected card grid.
- Treat the six screenshots supplied on 2026-07-22 as the page-level visual contract: Promociones uses two format charts plus the category/brand drill-down; Clientes uses age, gender, frequency, perceptions and a descriptive table; Predictivo uses four KPI cards, scatter, predictor bars and equation; Power BI uses a light 16:9 connection state; the model selection must strongly dim unrelated nodes, glow the selected node/edge, and show the `Normalización` summary.
- Apply this system consistently to every dashboard and documentation route, including responsive desktop and mobile states.
