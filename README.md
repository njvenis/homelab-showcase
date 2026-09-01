# homelab-showcase

`homelab-showcase` is a static, interactive map of a self-hosted control plane for models, memory, automation, observability, and remote access. It is designed to make the architecture legible quickly and to make the engineering constraints visible when a visitor spends longer with it.

The topology is the centrepiece rather than a decorative image. Visitors can run five scripted scenarios and watch packets travel across the declared connections, or select any node to inspect its role, location, and operational detail. The page also explains the three decisions that shape the system: only one heavy model is resident on the GPU at a time, memory is kept outside the inference box, and services are not exposed directly to the public internet.

## What the page shows

The current topology has three zones—Raspberry Pi 5, workstation/WSL2, and outside the house—with 22 nodes and 22 declared edges. The data describes services including Hermes, OpenCode, llama-swap, NInfer, vLLM, ComfyUI, Mnemosyne, Grafana, Tailscale, n8n, and the external services involved in the transitional briefing pipeline.

The five scenarios are:

- **Morning briefing** — threat intelligence moves through the hosted briefing path, local files, n8n, Resend, and the work inbox.
- **Task from Discord** — a message is routed through Hermes and OpenCode, fans out to subagents, uses memory and tracing, and returns to Discord.
- **Model swap** — llama-swap unloads Qwen, loads the diffusion model for ComfyUI, and returns to Qwen afterward.
- **Health sweep** — scheduled checks send their resulting metrics to Grafana.
- **Off-network access** — a phone joins the tailnet and reaches Hermes without opening public ports.

The flows are deliberately scripted and synthetic. This is an architectural showcase, not a live status page: there are no API calls, backend services, analytics, or real-time telemetry.

## How it works

The project uses Vite and TypeScript without a UI framework. The application renders the topology directly into SVG, calculates responsive node positions from the layout rules, and keeps scenario playback in a small state store with subscribers. A scenario is data: its ordered hops refer to edge IDs, each hop carries timing, and `reverse` controls travel direction on a bidirectional edge.

Packets use the browser's Web Animations API and CSS `offset-path`/`offset-distance`, so the animated packet follows the same path that the SVG edge displays. Flow colour has meaning: control, memory, inference, health, egress, and network traffic each use a dedicated CSS custom property. The automatic invitation runs once in scenario order after its delay, can be stopped, and never loops without an explicit replay; reduced-motion preferences disable packet travel and the automatic invitation while keeping manual controls usable with discrete progress.

The topology and scenario files are validated before a build. The loader checks IDs, zone membership, edge endpoints, and reverse-direction rules so a malformed data change fails early rather than producing a misleading diagram.

## Data sources

- `src/data/topology.json` — zones, nodes, edges, and node details.
- `src/data/scenarios.json` — scenario names, captions, and timed hops.
- `src/data/flow-content.json` — the longer two-sentence descriptions used by the Flows section.
- `src/data/readout.json` — authored machine values that cannot be derived from the topology, such as briefing time and approximate Qwen throughput. The displayed node count is derived from `topology.json`.

Positions and edge paths do not live in the content files. They are calculated by the layout module so the topology remains the single source of truth for what is connected.

## Run locally

Install dependencies and start Vite's development server:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The useful verification commands are:

```sh
npm run validate  # validate topology and scenario references
npm run build     # validate, type-check, and create a production build
npm run preview   # serve the production build locally
```

The Vite base path is configured for the project GitHub Pages URL at `/homelab-showcase/`. If the repository is moved to a `username.github.io` site repository, update `vite.config.ts` to use `/`.

## Project structure

```text
index.html          static shell, hero, decisions, and footer
src/main.ts         page rendering and interaction wiring
src/scenario.ts     shared scripted-playback state and scheduling
src/layout.ts       responsive topology layout and edge routing
src/packet.ts       packet animation and edge activity
src/style.css       tokens, typography, layout, and motion rules
src/data/           validated topology, scenarios, and page content
scripts/validate.ts data validation entry point
docs/               runbook and visual/design direction
```

## Design and engineering constraints

The visual language is intentionally quiet outside the flows. Fraunces carries display and section headings, IBM Plex Sans carries body and interface text, and IBM Plex Mono is reserved for literal machine values. There are no cards, dashboards, graph-layout dependencies, or animation libraries; native browser capabilities and a small amount of direct DOM code are enough for this fixed, explainable system.

The source is part of the showcase. Changes to topology, scenario direction, or operational assumptions should be recorded in the relevant data and decision documents rather than hidden in rendering code.

## Further reading

- [DECISIONS.md](./DECISIONS.md) — topology and flow-direction decisions.
- [docs/runbook.md](./docs/runbook.md) — project assumptions, topology reference, and build procedure.
- [docs/v2-lit.md](./docs/v2-lit.md) — current visual and interaction direction.
