## Context

The site is a static Vite/TypeScript page that renders `topology.json` into direct SVG DOM, schedules synthetic scenario hops in `src/scenario.ts`, and currently treats `--rule` as the idle edge colour. `src/packet.ts` already owns reference-counted edge activity and the approximately 600ms fade-back; `src/main.ts` owns the SVG, rail, legend, and inspector markup. See proposal.md and `specs/design-language/spec.md` for the contract.

The exact tour, arrival-pulse, and progress behavior is now defined in `docs/v2-lit.md` items 5–7; no separate phase-9 prompt is required.

## Goals / Non-Goals

**Goals:**

- Make idle colour semantic without changing any existing flow hue.
- Preserve the packet lifecycle, reference counting, fade-back timing, scenario captions, and reduced-motion comprehension while adding the phase-9 tour, arrivals, and progress treatment.
- Keep all visual colour in CSS custom properties and keep topology rendering data-driven.
- Give the stage one quiet, deterministic bloom and make the legend resemble the edges it explains.
- Remove generic kicker chrome while preserving information that visitors need.
- Retain Lighthouse accessibility at 100 and avoid colour-only or motion-only meaning.

**Non-Goals:**

- No new dependency, framework, backend, live telemetry, or animation library.
- No change to the six existing flow hue values, topology meaning, scenario ordering, hop timing, packet direction, or inspector semantics.
- No per-edge `drop-shadow`, dot grid, vignette, decorative card system, or additional background effects.
- No redesign of the phase-11 site structure; this change covers the existing stage, rail, legend, and inspector presentation only.

## Decisions

### Central token derivation in CSS

Keep the six full flow hues as the source of truth. Add `--surface-2` and `--flow-network`, set `--ink-muted` to `#93A5B5`, and define each `--edge-idle-*` as `color-mix(in oklch, var(--flow-*) 30%, var(--rule))` and each `--bloom-*` as `color-mix(in oklch, var(--flow-*) 14%, transparent)`. No component gets a new colour literal. This keeps hue changes centralized and makes the percentages reviewable.

### Use thin duplicate SVG paths for edge glow

Render each edge as a base path plus a non-interactive, aria-hidden duplicate path with a slightly wider stroke and low opacity. Both paths receive the same kind-specific idle colour and active flow colour. This is preferred to a filter because it avoids rasterizing 21 individual drop-shadow/filter effects and keeps glow geometry exactly aligned with the already-rendered path; the trade-off is one additional vector draw per edge, which is predictable and cheap for this fixed 21-edge diagram. The duplicate is not a second semantic edge and must not create an additional legend or accessibility node.

The activity record in `packet.ts` remains keyed by edge id and continues to hold active tokens plus the current fade animation. Starting activity sets the base and glow paths to the full flow token; ending the final token fades both back to the derived idle token. Cancelling a fade when new traffic starts preserves the existing reference-counting behavior.

### Keep node tint and accent in the SVG renderer

Have `main.ts` emit a kind class/data attribute and two SVG shapes per node: the substrate-backed node box and a 3px left accent rectangle at 60% opacity. CSS maps kind attributes to `color-mix(in oklch, var(--flow-*) 6%, var(--substrate))` for the box fill and the matching full flow token for the accent. The existing transitional class remains on the node box so its dash pattern is not replaced or hidden.

### Build one stage bloom from the current topology

Use one stage-level pseudo-element or equivalent background layer with a single radial gradient, combining the `--bloom-*` values for the two dominant flow kinds. Dominance is determined from edge-kind counts in `topology.json`; ties use the stable flow-kind order, making the current control/infer tie resolution deterministic rather than using `Math.random()` or viewport state. The bloom stays behind the SVG, is non-interactive, and is suppressed or reduced only as needed to preserve contrast. No second radial layer, dot pattern, or vignette is added.

### Extend existing state for tour, arrivals, and progress

Use the existing scenario subscription and packet lifecycle rather than a second hop scheduler. The idle-tour controller waits 2500ms after load, starts scenarios in `scenarios.json` order, waits 3000ms after each completion, loops, and permanently cancels itself on the first scenario-button click, node click, keypress, or play-control interaction. It never starts under reduced motion. A tour-owned scenario is cancelled when that permanent stop occurs; manual playback remains available.

Drive arrival pulses from packet completion and the hop's resolved destination (normal `edge.to`, reverse `edge.from`). Animate the destination node border 1.5 → 3 → 1.5 for 400ms with the existing packet easing; use one animation per node so a concurrent arrival cancels/restarts the current pulse. Under reduced motion, animate only a 400ms colour hold/fade with fixed stroke width.

Derive each scenario's total duration as `Math.max(...hops.map(({ at, duration }) => at + duration))`. Use one progress update loop only while a scenario is running to set a CSS custom property on its button from elapsed time / total duration; reset it on stop. Under reduced motion, set the property from `completedHops / totalHops` at subscription updates instead of continuously ticking. The progress bar is the tour's only progress indication.

### Make the legend and headings semantic

Expand the data-driven legend entry list to six kinds and use a short inline SVG/CSS dash with a low-alpha same-hue companion or equivalent styling, not a circular swatch. Remove kicker markup and its CSS rule; fold information into nearby headings only where it adds meaning. Keep labels, running state, captions, and meanings in text so visual lighting remains supplemental.

### No dependency and deterministic output

Use the current DOM, SVG, CSS custom properties, Web Animations API, and `prefers-reduced-motion` primitives. Do not install a package. All selected kinds, tour stops, pulse targets, and progress values come from topology/scenario data or explicit state; no `Math.random()` or time-derived content is introduced into rendered meaning.

## Risks / Trade-offs

- **[Risk]** Duplicated paths could be mistaken for duplicate edges or receive pointer/focus semantics. **Mitigation:** keep glow paths aria-hidden and pointer-events none, retain one edge id/semantic record, and validate the generated SVG structure.
- **[Risk]** Two simultaneous colour transitions could leave a stale glow after cancellation. **Mitigation:** keep one edge activity record per id, cancel the current fade when a token starts, and clear both paths only from the matching final fade callback.
- **[Risk]** The bloom or tinted nodes could lower contrast or overpower labels. **Mitigation:** use the specified 6%/14% mixes, place the bloom behind the stage, inspect all text/focus states, and run Lighthouse plus contrast checks.
- **[Risk]** Tour playback and manual playback could interfere. **Mitigation:** tag the active tour scenario in the controller, cancel only the tour-owned handle on permanent interaction, and let manual scenario buttons continue to use the existing engine.
- **[Risk]** Removing kickers could delete meaningful context. **Mitigation:** review every current `.section-kicker` occurrence and fold only informative text into its adjacent heading; delete redundant labels.

## Migration Plan

1. Capture the current production-build visual and Lighthouse baseline, then inventory all kicker occurrences and current edge/packet selectors.
2. Add the CSS token layer and network mapping without changing the existing full flow hues; validate token-only colour literals and build.
3. Render duplicate glow paths, kind-specific node presence, and the single stage bloom; verify idle and transitional states before wiring active traffic.
4. Update packet activity so base and glow paths share reference counting and fade-back, then verify overlapping packets, cancellation, reverse hops, and network packets.
5. Carry the existing phase-9 tour, arrival pulses, and progress behavior into the current scenario state, add the six-entry dash legend, remove kickers, and delete `src/counter.ts`.
6. Run `npm run validate` and `npm run build`; test idle tour stop boundaries, normal/reduced motion, 380px layout, keyboard focus, contrast, and Lighthouse accessibility 100 at the deployed base path.
7. Roll back by reverting the phase commit; topology/scenario JSON and the pre-existing scenario engine remain the fallback source of behavior.
