## Why

With the diagram above the fold and its controls beside it, the remaining problem is attention. Twenty-one nodes and twenty-one edges are rendered at uniform weight at all times, so a running scenario reads as ambient movement rather than an authored path, and selecting a node tells you about it without showing you where it sits in the graph.

Separately, five scenarios ranging from 2 hops to 17 are presented as five identical entries. `health-sweep` finishes in 0.8 seconds — clicking it reads as a broken button, because it is over before the eye reaches the stage.

This change adds focus rather than simplification: the full graph stays rendered and emphasis is transient and reader-driven. Nothing is removed, hidden, or grouped for tidiness — the node count is the substance of the page.

A reviewer should be able to tell the five scenarios apart before playing them, see which paths a running scenario touches, select a node and see its immediate neighbourhood, and read a scenario's whole script in advance.

## What Changes

- Wrap edges in `g.edge-group` so dimming composes with the existing packet animation instead of competing with it.
- Add selection focus and playback focus, with selection taking precedence and never interrupting a running scenario.
- Suppress arrival pulses on dimmed nodes; stop the idle tour on node selection.
- Add derived scenario metadata — hop count and `runtime` duration — computed at render time, never authored.
- Add a path readout showing a scenario's ordered hop list in advance, with the current step marked during playback.
- Give `ext` a context tier via an optional, validated `emphasis` field on `Zone`.
- Derive legend entries from edge kinds in a canonical order, replacing the literal array.
- Add a validation guard that fails when a zone has no wide-layout entry.

## Non-Goals

- No node wrapper. Nodes already render inside `g.node-control`; a second element carrying `data-node-id` would break the `nodeControls` map and the arrival-pulse lookup. Dimming targets the existing element.
- No change to `src/packet.ts`, to packet insertion (packets stay children of the SVG root and are never dimmed), to scenario timing, or to hop semantics.
- No derivation of the stage bloom from data. Edge kinds tie at rank 2 — infer 4, network 4 — so derivation would be non-deterministic on a page whose determinism is a stated principle. The hardcoded pair stays.
- No restructuring of the wide layout's zone rectangles into a computed layout. Worth doing, but not inside a design change where a regression would be unattributable. This ships a validator guard instead.
- No new colour hue, no new dependency, no framework.

## Capabilities

### New Capabilities

- `flow-focus`: selection and playback focus states with precedence, path readout, derived scenario metadata, zone emphasis tier, data-derived legend, and layout-coverage validation.

### Modified Capabilities

- `scenario-engine`: state exposes the running scenario's participating edge id set and current hop index for presentation. No change to timing, determinism or hop semantics.
- `data-model`: `Zone` gains an optional, defaulted, validated `emphasis` field. Existing data renders identically without it.

## Impact

- `src/main.ts`, `src/style.css`, `src/scenario.ts`, `src/types.ts`, `src/data/load.ts`, `src/data/topology.json`, `scripts/validate.ts`.
- Not changed: `src/packet.ts`, `src/layout.ts`, `src/data/scenarios.json`, `src/data/flow-content.json`, `src/data/readout.json`, `index.html`, `vite.config.ts`, `.github/workflows/deploy.yml`.

## Dependencies

Requires `phase-13b-stage-composition` to have shipped — the path readout and detail panel both live in `.control-column`.

## Implementation Handoff

This proposal is implemented by a local-inference coding agent. Claude is the specification and design author, not the frontend builder.

Before starting, read `docs/implementation-handoff.md`. It is binding and covers: change order, files to inspect, files that may and may not be edited, commands per milestone, visual states and viewports to check, accessibility, data-validation and build checks, what constitutes a failed implementation, the register of open implementation decisions with recommended defaults, and the completion report format.

The implementing agent must not invent product requirements. Where a choice is genuinely open it appears in the handoff's decision register with a recommended default; anything not in that register and not settled by this spec is an ambiguity to report, not to resolve.

