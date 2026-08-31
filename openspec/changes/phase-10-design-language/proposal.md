## Why

This implements runbook Step 6, Design direction, and the v2 “Lit” departure described in `docs/v2-lit.md`. The current idle topology hides the semantic structure of the network behind uniform grey edges; lighting each link by flow kind makes the stack legible at rest while preserving traffic as the primary motion cue.

## What Changes

- Add the v2 token layer: `--surface-2`, `--flow-network`, `--edge-idle-*`, and `--bloom-*` derived with `color-mix(in oklch, ...)`; lift `--ink-muted` to `#93A5B5` without changing existing flow hues.
- Render every idle edge in its kind-specific idle hue with a restrained same-hue glow, brighten active edges to their full flow hue, and preserve reference-counted activity plus fade-back timing.
- Correct network packet colour to use `--flow-network`.
- Add kind-colour presence to nodes while retaining substrate fill and the transitional dash treatment.
- Add one restrained two-hue radial stage bloom, with no dot grid or vignette.
- Carry forward the phase-9 idle tour, arrival pulses, progress treatment, and reduced-motion behavior unchanged; the tour must stop at the defined interaction, completion, visibility, and reduced-motion boundaries.
- Expand the legend to six entries, including network, and render swatches as glowing lit dashes.
- Remove the `.section-kicker` treatment, folding meaningful kicker information into headings and deleting redundant kickers.
- Delete `src/counter.ts`.
- Keep the implementation dependency-free and preserve Lighthouse accessibility at 100, including text contrast under the lit treatment.

## Capabilities

### New Capabilities

- `design-language`: Provides the v2 lit visual tokens, semantic edge/node lighting, stage bloom, legend treatment, carried-forward tour/pulse/progress behavior, and accessible reduced-motion presentation.

### Modified Capabilities

- None.

## Impact

- Affects `src/style.css`, `src/main.ts`, `src/packet.ts`, and the scenario/edge presentation lifecycle; removes `src/counter.ts`.
- Reuses the existing direct SVG renderer, scenario engine, Web Animations API, CSS custom properties, and topology/scenario JSON. No new dependencies, backend, or framework is introduced.
- Afterward a reviewer should see a permanently lit six-kind topology, brighter in-flight edges, kind-tinted nodes, a barely perceptible stage bloom, glowing dash legend swatches, the existing tour/pulse/progress behavior, no uppercase tracked kickers, and no accessibility regression.

## Planning Assumption

`phase-9-polish-prompts.md` is not present in the repository or reachable history. This proposal treats the v2 direction and verification prompt as authoritative for the carried-forward behavior: the idle tour runs only while the page is untouched, stops on user interaction, scenario completion, visibility loss, or reduced-motion preference, and reduced motion disables the tour/travel while retaining understandable colour-step pulses and progress.
