## Context

The page already has a data-driven SVG topology, scripted scenario playback, and the five CSS flow-colour tokens defined by the runbook. The interaction layer must add user controls without introducing a framework, duplicating topology content, or changing the packet and scenario contracts. See proposal.md for motivation and `specs/interaction/spec.md` for the behavior contract.

## Goals / Non-Goals

**Goals:**

- Add a small DOM interaction state for the selected node, open inspector, invoking node, and active scenario.
- Keep node controls and scenario controls generated from the validated JSON data.
- Make focus order, focus-visible styling, Escape dismissal, and inspector reading order explicit.
- Reuse the existing scenario playback engine and CSS custom-property palette.
- Provide a compact, always-available legend that makes each flow colour meaningful without relying on colour alone.

**Non-Goals:**

- Replacing the direct SVG renderer or adding a component framework.
- Changing topology, scenario, hop timing, packet animation, or flow-colour definitions.
- Adding a router, URL state, persistence, live telemetry, or a second source of scenario/node content.
- Adding decorative interaction animations; any existing motion should retain its established reduced-motion behavior.

## Decisions

- **Use native focusable controls for nodes and rail items.** Render each node with a keyboard-focusable button-like SVG control, or an equivalent native control wrapper that preserves the node's visual position, and render each scenario as a native button. This gives keyboard and assistive technology semantics without reimplementing tab, Enter, or Space behavior. A canvas-wide key handler was rejected because it hides individual node focus and creates fragile keyboard semantics.
- **Keep interaction state in the existing small page store.** Store the active scenario id, selected node id, inspector-open state, and invoking node reference in the same lightweight state pattern already used by the site. This avoids a new state library and ensures scenario playback and the rail share one source of active-state truth.
- **Treat the inspector as a modal reading surface.** On open, expose the inspector as a labelled dialog or equivalent modal surface, retain the invoking node, dim the canvas, and place focus on the inspector heading or close control. Escape closes it and restores the retained node focus. A permanent side panel was rejected because it would not satisfy the requested canvas dimming or focus-return behavior.
- **Use data attributes and existing tokens for visual state.** Mark active scenario, focused/selected node, transitional status, and dimmed canvas through semantic attributes/classes; use `var(--flow-control)`, `var(--flow-memory)`, `var(--flow-infer)`, `var(--flow-health)`, and `var(--flow-egress)` for legend swatches. No new colour literals or duplicated labels are introduced.
- **Make the legend redundant with text.** Each legend row contains a colour swatch and its flow-kind label/meaning. The text remains available to visitors who cannot distinguish hues, and the swatch is decorative rather than the only carrier of meaning.
- **Do not add a dependency.** Native DOM events, focus APIs, ARIA semantics, CSS custom properties, and the existing playback code are sufficient. No dependency is justified for this interaction surface.
- **Keep interaction deterministic.** Scenario identity and node identity come from JSON ids; selecting the same control produces the same playback request and rendered state. No `Math.random()` or time-derived content is introduced in the interaction path.

## Risks / Trade-offs

- **[Risk]** SVG-native focus behavior varies between browsers → **Mitigation:** use a focusable native control/wrapper with an explicit accessible name, test keyboard traversal in the target browsers, and style `:focus-visible` with a high-contrast ring.
- **[Risk]** Focus can escape an open inspector or return to a removed node → **Mitigation:** constrain the modal surface's keyboard path while open, retain the invoking node element, and restore focus only when that element is still connected; otherwise use the topology's first available node as a safe fallback.
- **[Risk]** A scenario can finish or be replaced while its rail state is displayed → **Mitigation:** subscribe the rail to the playback lifecycle and define the running marker from the single active scenario state, clearing or replacing it on completion and new activation.
- **[Risk]** Dimming can reduce contrast for the inspector if the overlay covers the wrong stacking layer → **Mitigation:** place the dimming layer behind the inspector and verify text, controls, focus rings, and legend contrast in the acceptance walkthrough.

## Migration Plan

Add the interaction DOM and styles beside the existing renderer, wire node activation and scenario controls to the current playback/store lifecycle, then validate the required keyboard and inspector scenarios manually. No data migration or dependency installation is required. Rollback is limited to removing the interaction wiring and styles; existing topology, scenario JSON, and packet behavior remain usable.

The runbook checkpoint is the Step 10 acceptance: traverse the full page by keyboard, confirm every node receives a visible focus ring, open an inspector, verify the canvas dims, dismiss with Escape, confirm focus returns to the invoking node, and start/identify scenarios from the rail.
