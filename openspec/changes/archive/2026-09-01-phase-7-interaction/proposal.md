## Why

This implements runbook Step 10, Interaction. The topology and scripted flows need a usable way to explore scenarios and inspect the engineering rationale behind each node; without keyboard access and clear flow semantics, the diagram remains difficult to understand and inaccessible.

## What Changes

- Add a keyboard-operable scenario selector rail that starts and identifies the active scenario.
- Add a node inspector panel showing the selected node's label, zone, kind, and detail.
- Dim the topology canvas while the inspector is open and restore focus to its invoking node when the panel closes with Escape.
- Make every topology node keyboard reachable with a visible focus ring.
- Mark transitional node status in the inspector.
- Add a legend mapping the five flow colours to control, memory, inference, health, and egress meanings.

## Capabilities

### New Capabilities

- `interaction`: Provides scenario selection, node inspection, keyboard navigation, focus management, transitional status, canvas dimming, and flow-colour legend behaviour.

### Modified Capabilities

None.

## Impact

- Extends the direct SVG DOM rendering layer and the page's static interaction state; topology and scenario content remain data-driven.
- Adds inspector, scenario rail, legend, focus, and modal-like overlay styling using existing CSS custom properties.
- Connects to the existing scenario playback engine without changing its scripted data or animation primitives.
- Adds no dependency, backend, API, or data migration.
- A reviewer should be able to select each scenario, identify the running one, traverse every node by keyboard, open and dismiss an inspector without a mouse, see the canvas dim while it is open, and use the legend to interpret all five flow colours.
