## Why

This implements runbook Step 6, Design direction, and the v2 “Lit” departure described in `docs/v2-lit.md`. The current idle topology hides the semantic structure of the network behind uniform grey edges; lighting each link by flow kind makes the stack legible at rest while preserving traffic as the primary motion cue.

## What Changes

- Add the v2 token layer: `--surface-2`, `--flow-network`, `--edge-idle-*`, and `--bloom-*` derived with `color-mix(in oklch, ...)`; lift `--ink-muted` to `#93A5B5` without changing existing flow hues.
- Render every idle edge in its kind-specific idle hue with a restrained same-hue glow, brighten active edges to their full flow hue, and preserve reference-counted activity plus fade-back timing.
- Correct network packet colour to use `--flow-network`.
- Add kind-colour presence to nodes while retaining substrate fill and the transitional dash treatment.
- Add one restrained two-hue radial stage bloom, with no dot grid or vignette.
- Add the defined idle tour: start 2500ms after load, play scenarios in `scenarios.json` order with 3000ms rests, loop indefinitely, and stop permanently for the session after any user interaction; never start under reduced motion.
- Add 400ms destination-border arrival pulses from packet completion, restarting concurrent pulses; under reduced motion use a discrete colour step with no width animation. Add elapsed-time running progress on the scenario button, stepping per hop under reduced motion.
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

## Source of Truth

The detailed tour, arrival-pulse, progress, and reduced-motion contract is defined in `docs/v2-lit.md` items 5–7 and its verification prompt. No separate phase-9 prompt is required.
