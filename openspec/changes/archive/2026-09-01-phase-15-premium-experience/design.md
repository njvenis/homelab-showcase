# Design — phase-15-premium-experience

## Context

`homelab-showcase` is a static Vite/TypeScript site with direct SVG rendering, computed layout, JSON-backed topology/scenarios, and native Web Animations API playback. The current live page already expresses a restrained “lit” direction: semantic idle hues, faint glow, editorial prose, a scenario rail, path readout, and accessible node inspection. The refinement must improve comprehension and control without turning the fixed architecture into a dashboard or pretending synthetic flows are telemetry.

The archived `phase-10-design-language` change is the baseline for this design. This design intentionally supersedes only its indefinite idle-tour loop; its palette, glow, arrival, progress, and reduced-motion foundations carry forward.

## Goals / Non-Goals

### Goals

- Establish hero > topology > playback > editorial prose as the visual hierarchy.
- Add non-colour and text cues to the six semantic flow kinds.
- Bound and control automatic playback while retaining the existing scenario engine.
- Preserve the topology while reading selected-node detail.
- Make 1440, 1024, 768, and 390px compositions deliberate and overflow-free.
- Preserve data truth, deterministic animation, accessibility, and reduced motion.

### Non-Goals

- No live data, new graph edges, backend, framework, dependency, or topology coordinates in JSON.
- No generic cards, decorative motion, neon treatment, or dashboard metrics.
- No change to the meaning of current nodes, zones, edges, reverse hops, or scenarios.

## Decisions

### 1. Instrumented topology, not dashboard chrome

Keep the dark lit palette, Fraunces/Plex type system, prose rows, and stage bloom. Preserve the current authoritative hero scale and ensure section headings remain subordinate through existing token consumers; do not introduce a new visual system.

### 2. Hue plus a secondary cue

Keep the six full hues and derived idle hues as the semantic colour source. Add deterministic per-kind stroke patterns and a derived endpoint/kind label on edge hover and selected node/path context. Edges do not become additional keyboard focus stops; the existing one-tab-stop roving node model remains. The patterns must not encode direction. If visual testing shows the six patterns add noise, retain the text cue and reduce idle pattern contrast rather than inventing a different edge meaning.

### 3. One bounded invitation pass

The current auto-tour is useful as an invitation but indefinite background motion is not a premium reading experience. Run one data-order pass after the existing 2500ms delay, then hold. A visible Stop playback action cancels it; explicit Replay is the only restart. Manual scenario play remains independent and available. Reduced motion never starts the invitation.

### 4. Single playback owner

Do not create a second scheduler for the stop/replay UI. Extend the existing tour ownership in `src/main.ts` / `src/scenario.ts`, route cancellation through `stop()`, and continue deriving progress and steps from `ScenarioState` and hop data.

### 5. Non-destructive detail

The selected node remains in the SVG and the inspector remains a named non-modal region. At desktop/tablet, detail occupies the control/document column; at phone, it is a bounded scrollable sheet. Selection emphasis can dim unrelated edges/nodes, but it never removes the topology or interrupts playback.

### 6. Geometry stays computed

Improve clearance and channel routing in `src/layout.ts` using topology and viewport dimensions only. Add assertions/verification for overlap and stacked height. Never add authored x/y, lane, dash, or label-width fields to JSON.

### 7. Explicit state matrix

Loading, empty, error, hover, focus, selected, running, stopped, disabled, and reduced-motion states must be specified before implementation. Each state must have a text/semantic fallback where visual styling or motion is unavailable.

## Risks / Trade-offs

- More visible edge grammar can reduce the quietness of the lit map; grayscale and colour-vision review is required.
- Hero sizing can regress fold targets; browser measurements are a hard gate.
- A bounded tour supersedes the archived phase-10 behavior; it is intentionally called out as a successor rule and must not be implemented alongside the old indefinite loop.
- Stacked geometry may need more height for clearance; failing a bound is preferable to clipping or lying about edges.
- A phone sheet improves detail readability but can occlude stage content; cap height, put Close first, and test 390px plus short viewports.
- Stop/replay state can race reduced-motion changes; one tour owner and engine cleanup prevent stale packets/progress.

## Dependency declaration

No new dependency is added. The implementation uses existing TypeScript, direct DOM/SVG, CSS custom properties, ResizeObserver, Web Animations API, and `prefers-reduced-motion`.

Determinism is binding: no `Math.random()` in animation paths, no random layout, no time-derived labels, and no live network state.

## Migration Plan

1. Confirm the archived `phase-10-design-language` baseline; capture current screenshots and accessibility results.
2. Tune hero/section consumers and playback control tokens; verify fold, contrast, and no overflow.
3. Refine computed node clearance and channel paths; verify stable ids, edge count, label bounds, and packet re-layout.
4. Add one-pass tour ownership and Stop/Replay controls; verify manual/automatic/reduced-motion boundaries and bounded announcements.
5. Reconcile inspector behavior across all breakpoints; verify focus, scrolling, and non-occlusion.
6. Verify all state variants, update source-of-truth docs, and run validate/build/browser/axe/Lighthouse checks.
7. Roll back by reverting the phase-15 commit; retain phase-10's verified lit topology and the unchanged JSON data as fallback.
