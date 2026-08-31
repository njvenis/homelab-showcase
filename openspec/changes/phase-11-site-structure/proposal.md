## Why

The v2 Lit direction makes the topology the visual centre, but the page currently ends at the diagram, rail, caption, and legend. This change completes the surrounding site structure so visitors can read the system's current scale, understand each scripted flow, see the engineering decisions behind it, and reach the source without turning the page into a dashboard.

This implements the site-structure portion of `docs/v2-lit.md` after the v2 design-language work. A reviewer should be able to see the instrument-like hero readout, five playable prose flow rows, three decision explanations, and the minimal source footer while the existing diagram interaction behaves exactly as before.

## What Changes

- Add one lowercase IBM Plex Mono readout beneath the hero standfirst, with spaced middle-dot separators for node count, resident model count, briefing time, and Qwen throughput.
- Derive the node count from `topology.json` and load the remaining readout values from a small `src/data/readout.json` data file; do not introduce stat cards or big-number presentation.
- Add a full-width Flows section below the diagram containing one row for each of the five scenarios, with its Fraunces name, a two-sentence plain-language description expanded from the scenario caption, and a play control.
- Make each Flows play control invoke the existing scenario engine, scroll the topology stage into view, and mirror the rail button's running/stopped state and treatment.
- Style each flow row with a 3px left accent in its scenario's dominant flow hue; use spacing rather than borders or cards to separate rows.
- Add a Decisions section with three unornamented Fraunces-heading prose blocks covering one resident model, memory outside inference, and public exposure boundaries.
- Add a one-line footer linking to `https://github.com/njvenis/homelab-showcase` and stating “Built with the stack it describes.”
- Preserve the scenario rail, caption, inspector, stage rendering, and existing playback behavior; this change adds structure around the diagram and does not alter diagram internals.
- Keep the implementation dependency-free and ensure the readout wraps cleanly at 380px with keyboard-accessible controls.

## Capabilities

### New Capabilities

- `site-structure`: Provides the v2 Lit hero readout, scenario flow rows with shared playback controls, engineering decisions section, and minimal source footer around the existing topology experience.

### Modified Capabilities

- None.

## Impact

- Affects `index.html`, `src/main.ts`, `src/style.css`, and the data loading/types needed for `src/data/readout.json`.
- Reuses the existing topology and scenario data, scenario store, rail state rendering, native scrolling, direct DOM rendering, and CSS custom properties. No new dependency, backend, or framework is introduced.
- Adds page structure and content only; topology layout, packet animation, rail behavior, caption behavior, inspector behavior, and stage semantics remain unchanged.
