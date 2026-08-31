## Context

The site is a static Vite/TypeScript page that renders `topology.json` into direct SVG DOM, schedules synthetic scenario hops in `src/scenario.ts`, and currently treats `--rule` as the idle edge colour. `src/packet.ts` already owns reference-counted edge activity and the approximately 600ms fade-back; `src/main.ts` owns the SVG, rail, legend, and inspector markup. See proposal.md and `specs/design-language/spec.md` for the contract.

The repository does not contain the referenced `phase-9-polish-prompts.md`; the carried-forward tour/pulse/progress boundary is therefore the explicit assumption recorded in proposal.md and this design.

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

Use the existing scenario subscription and packet lifecycle instead of a parallel scheduler. The idle-tour controller listens for pointer/keyboard interaction, scenario activation, inspector opening, `visibilitychange`, and `prefers-reduced-motion`; it clears its timer and stops on the first boundary, final configured tour stop, or reduced-motion enablement. Arrival pulses are driven by packet completion/destination data, and progress is derived from the existing completed-hop/total-hop state. Under reduced motion, CSS and a small preference boundary suppress travelling packets and tour execution while keeping timed edge steps, colour-step arrivals, captions, and progress available.

### Make the legend and headings semantic

Expand the data-driven legend entry list to six kinds and use a short inline SVG/CSS dash with a low-alpha same-hue companion or equivalent styling, not a circular swatch. Remove kicker markup and its CSS rule; fold information into nearby headings only where it adds meaning. Keep labels, running state, captions, and meanings in text so visual lighting remains supplemental.

### No dependency and deterministic output

Use the current DOM, SVG, CSS custom properties, Web Animations API, and `prefers-reduced-motion` primitives. Do not install a package. All selected kinds, tour stops, pulse targets, and progress values come from topology/scenario data or explicit state; no `Math.random()` or time-derived content is introduced into rendered meaning.

## Risks / Trade-offs

- **[Risk]** Duplicated paths could be mistaken for duplicate edges or receive pointer/focus semantics. **Mitigation:** keep glow paths aria-hidden and pointer-events none, retain one edge id/semantic record, and validate the generated SVG structure.
- **[Risk]** Two simultaneous colour transitions could leave a stale glow after cancellation. **Mitigation:** keep one edge activity record per id, cancel the current fade when a token starts, and clear both paths only from the matching final fade callback.
- **[Risk]** The bloom or tinted nodes could lower contrast or overpower labels. **Mitigation:** use the specified 6%/14% mixes, place the bloom behind the stage, inspect all text/focus states, and run Lighthouse plus contrast checks.
- **[Risk]** The absent phase-9 source could hide an intended tour edge case. **Mitigation:** use the explicit stop boundaries recorded in proposal.md, preserve existing scenario controls and reduced-motion rules, and make the acceptance task report each stop condition separately.
- **[Risk]** Removing kickers could delete meaningful context. **Mitigation:** review every current `.section-kicker` occurrence and fold only informative text into its adjacent heading; delete redundant labels.

## Migration Plan

1. Capture the current production-build visual and Lighthouse baseline, then inventory all kicker occurrences and current edge/packet selectors.
2. Add the CSS token layer and network mapping without changing the existing full flow hues; validate token-only colour literals and build.
3. Render duplicate glow paths, kind-specific node presence, and the single stage bloom; verify idle and transitional states before wiring active traffic.
4. Update packet activity so base and glow paths share reference counting and fade-back, then verify overlapping packets, cancellation, reverse hops, and network packets.
5. Carry the existing phase-9 tour, arrival pulses, and progress behavior into the current scenario state, add the six-entry dash legend, remove kickers, and delete `src/counter.ts`.
6. Run `npm run validate` and `npm run build`; test idle tour stop boundaries, normal/reduced motion, 380px layout, keyboard focus, contrast, and Lighthouse accessibility 100 at the deployed base path.
7. Roll back by reverting the phase commit; topology/scenario JSON and the pre-existing scenario engine remain the fallback source of behavior.
