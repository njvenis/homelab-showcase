# AGENTS.md

## Project
Static single-page interactive diagram of a homelab AI stack. Animated data flows are
scripted and synthetic — no live telemetry, no API calls, no backend.

Reference: docs/runbook.md. Section 3 is the topology, section 4 the scenarios,
section 6 the design tokens. DECISIONS.md records the data-shape decisions.

## Hard constraints
- Vite + TypeScript. No framework. No React, Vue, Svelte, or any UI library.
- No animation library. Web Animations API and CSS offset-path only.
- No graph layout library. Positions come from src/layout.ts.
- No Math.random() anywhere in animation or rendering code.
- All colour via CSS custom properties. No raw hex outside the token block in style.css.
- All topology and scenario content in JSON under src/data/. Never inline in code.
- Never edit files under docs/ unless asked.

## Direction model
Edges carry `bidirectional` — a rendering fact, arrowheads both ends or none.
Hops carry `reverse` — an animation fact, offset-distance 100% to 0%.
One path per link. Never declare a second edge for a return leg. See DECISIONS.md.

## Working style
- Stop and report after each deliverable set. Do not continue to the next step.
- If a constraint above blocks the task, say so and stop. Do not work around it.
- State any assumption you made rather than burying it in the code.
