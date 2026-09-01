## 1. Accessible topology controls

- [x] 1.1 Add a data-driven, focusable control for each rendered topology node with an accessible name and visible `:focus-visible` ring; verify `npm run build` succeeds and keyboard traversal can focus every node.
- [x] 1.2 Add inspector state and rendering for the activated node, including label, zone, kind, detail, and conditional transitional status; verify clicking and keyboard activation show the correct data for a stable node and the transitional node.
- [x] 1.3 Add inspector dismissal, focus restoration, and canvas dimming with an accessible modal/dialog relationship; verify Escape closes the inspector, removes dimming, and returns focus to the invoking node.

## 2. Scenario rail and legend

- [x] 2.1 Render the scenario selector rail from the validated scenarios data and connect keyboard-operable controls to the existing scenario playback lifecycle; verify activation starts the selected scenario and its control remains visibly marked while it runs.
- [x] 2.2 Add the five-entry flow legend using the existing control, memory, inference, health, and egress CSS custom properties plus text meanings; verify all five entries are present and remain understandable without colour perception.

## 3. Integration and acceptance

- [x] 3.1 Style and compose the inspector, dimming layer, scenario rail, legend, and focus states within the existing visual system without adding a dependency; verify the page builds and the inspector remains readable and operable over the dimmed canvas.
- [x] 3.2 Run `npm run validate` and `npm run build`, then manually complete the Step 10 checkpoint: traverse the full page by keyboard, confirm every node has a visible focus ring, open an inspector, verify the canvas dims, dismiss with Escape, confirm focus returns to the invoking node, and start/identify a scenario from the rail.
