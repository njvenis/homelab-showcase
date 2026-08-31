## Why

The page currently relies on ad hoc type sizes, one oversized content measure, and divider-heavy spacing, so the hero and diagram do not establish a clear reading hierarchy. This change implements the phase-12 composition brief through the runbook's proposal → specs → design → tasks loop, giving the existing page a deliberate scale, measure, and rhythm without changing its colour, motion, components, or data.

A reviewer should be able to see the new type and spacing hierarchy, the diagram as the widest element, left-aligned prose in an explicit narrow measure, editorial two-column Flows and Decisions sections, and the expanded hero treatment at desktop and narrow widths while the existing lit treatment, tour, pulses, and progress bars behave unchanged.

## What Changes

- Add the specified type, space, and measure custom-property scales to `src/style.css`.
- Replace every non-token `font-size`, `margin`, and `padding` length in the stylesheet, preserving only permitted border widths and SVG geometry raw lengths.
- Assign the prose, wide-content, and diagram-stage measures so the stage is the widest page element and prose is left-aligned in its own column.
- Apply the scenario rail's narrow-label / wide-content grid to Flows and Decisions, with Fraunces section headings at `--text-2xl`, sticky positioning, and one-column collapse below 900px.
- Establish `--space-32` between major sections and remove section-divider rules except the single rule beneath the hero; retain flow-row accent bars.
- Apply the specified hero title scale, width, line-height, and spacing to the standfirst, readout, and stage.
- Preserve all existing colour tokens, animation and interaction behaviour, SVG rendering, scenario/data files, and the files explicitly excluded by the brief.

## Capabilities

### New Capabilities

- `composition`: Defines the page's tokenized type, spacing, measure, responsive editorial layout, section rhythm, and hero hierarchy for the existing site structure.

### Modified Capabilities

- None.

## Impact

- Affects `src/style.css` and the existing page layout selectors that consume it; implementation must first trace the current structure in `index.html` and `src/main.ts` without changing their behavior.
- No API, data, backend, framework, or dependency changes.
- Must not modify `src/packet.ts`, `src/scenario.ts`, or any data file.
- Verification includes a raw-length audit of `src/style.css`, Lighthouse accessibility at 100, and screenshots at 380px, 900px, and 1440px.
