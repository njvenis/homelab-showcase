## Why

This implements runbook Step 11, Quality floor. The topology experience needs to remain understandable for visitors who prefer reduced motion, use narrow screens, or rely on assistive technology; these are independent quality risks best addressed in parallel before the public-repo hygiene step.

## What Changes

- Add a CSS-driven reduced-motion presentation in which packets do not travel, topology edges highlight for each hop duration and fade, and scenario captions continue stepping through the flow.
- Make the page usable down to 380px, stack the three topology zones below roughly 900px, re-route SVG edges from the layout model for the stacked geometry, and present the inspector as a bottom sheet on narrow viewports.
- Raise Lighthouse accessibility to 100 by adding SVG roles and accessible names, a topology text alternative generated from `topology.json`, sufficient muted-text contrast, and clearly visible keyboard focus rings.
- Implement the three workstreams in separate worktrees, then merge them in motion, responsive, accessibility order and run the combined quality checkpoint.

## Capabilities

### New Capabilities

- `quality-floor`: Provides reduced-motion scenario playback, responsive topology layout and edge routing, narrow-viewport inspector behavior, and accessible diagram semantics and text alternatives.

### Modified Capabilities

- None.

## Impact

- Affects the scenario playback presentation, CSS motion preferences, responsive page styles, `src/layout.ts` edge geometry, inspector layout, SVG accessibility semantics, and generated screen-reader description output.
- Uses the existing direct SVG DOM renderer, Web Animations API/CSS primitives, topology JSON, CSS custom properties, and validation/build tooling; no new dependency or backend is required.
- A reviewer should be able to toggle the operating system's reduced-motion setting and observe sequential edge highlights with captions but no travelling packets, resize to 380px and see stacked zones with correctly routed edges and a bottom-sheet inspector, and inspect the diagram with Lighthouse and a screen reader to confirm a 100 accessibility score and a topology description derived from `topology.json`.
