# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable design direction

- Treat `C:\Users\LENOVO\Downloads\Tablero Tambo (offline).html` and the supplied Sede UC screenshots as the visual source of truth for this dashboard.
- Keep the product identity as `Tambo+` with the descriptor `TABLERO · SEDE UC`.
- Preserve the dark executive visual system: compact sidebar, amber/coral/violet gradient brand mark, white filter chips with dark custom menus, 16 px dashboard cards, Space Grotesk display typography, Inter UI text, JetBrains Mono metadata, and restrained glow/motion.
- The data-model page must show the connected interactive snowflake schema, including the fact table, dimensions, subdimensions, relationship lines, and a field inspector; do not replace it with an unconnected card grid.
- Apply this system consistently to every dashboard and documentation route, including responsive desktop and mobile states.
