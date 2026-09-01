## Why

The page's subject is not visible when you arrive. Measured at 1440×900, the topology SVG's top edge sits roughly 900px down the document, behind an 8rem-padded hero and a scenario rail whose heading is `--text-2xl`. Selecting a node dims the diagram and covers part of it. The flow key sits below the stage as a separate section, so the reader must look away from the diagram to decode it.

Phase-12 was right that the page had no hierarchy. It gave the top of the scale to the hero, which is correct for an article and wrong for an instrument. This change reassigns which element receives that emphasis, and puts the diagram's controls beside it rather than stacked above and below.

A reviewer should be able to load the page at 1440×900 and see the diagram immediately, select a node without losing sight of it, and read the flow key beside the thing it explains.

## What Changes

- Compress the masthead: `h1` from `--text-hero` to `--text-2xl`, padding from `--space-32` to `--space-12`/`--space-8`, stage margin from `--space-24` to `--space-8`.
- Introduce `.control-column` and a two-column shell at ≥1024px: topology left, controls right.
- Move node detail out of the stage into the control column; delete `.canvas-dimmer`; remove modal semantics and the focus-on-open call.
- Define responsive behaviour by range, including 769–1023px, landscape phones and short viewports.
- Retune the stacked-layout constants so the mobile diagram fits within 1200px.
- Define loading, empty, error, hover, pressed, disabled, re-activation and reduced-motion states.

## Non-Goals

- No change to `src/packet.ts`, scenario timing, hop semantics, or any data file.
- No focus dimming, path readout, scenario metadata or zone emphasis — those are `phase-13c-flow-focus`.
- No additional node wrapper. Nodes already render inside `g.node-control`; adding another element carrying `data-node-id` would break the `nodeControls` map and the arrival-pulse lookup.
- No restructuring of the wide layout's zone rectangles.
- No new colour hue, no new dependency, no framework, no change to the Vite `base` path.

## Capabilities

### New Capabilities

- `stage-composition`: stage-first page composition, control column, node-detail panel, responsive ranges, and interaction states.

### Modified Capabilities

- `composition`: masthead scale and spacing reduced; measures extended for a two-column stage region. Editorial Flows and Decisions treatment unchanged and regression-checked.
- `interaction`: node detail moves from modal overlay to persistent panel; focus stays on the invoking node when detail opens.

## Impact

- `src/main.ts`, `src/style.css`, `src/layout.ts` (stacked constants only), `index.html` (no new structural element; data import path only if the error state requires it).
- Not changed: `src/packet.ts`, `src/scenario.ts`, `src/types.ts`, `src/data/*`, `vite.config.ts`, `.github/workflows/deploy.yml`.

## Dependencies

Requires `phase-13a-a11y-correctness` to have shipped. The focus-return contract and roving-tabindex model specified there are assumed by this change's focus-on-open requirement.

## Implementation Handoff

This proposal is implemented by a local-inference coding agent. Claude is the specification and design author, not the frontend builder.

Before starting, read `docs/implementation-handoff.md`. It is binding and covers: change order, files to inspect, files that may and may not be edited, commands per milestone, visual states and viewports to check, accessibility, data-validation and build checks, what constitutes a failed implementation, the register of open implementation decisions with recommended defaults, and the completion report format.

The implementing agent must not invent product requirements. Where a choice is genuinely open it appears in the handoff's decision register with a recommended default; anything not in that register and not settled by this spec is an ambiguity to report, not to resolve.

