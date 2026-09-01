## Context

The page is a static Vite/TypeScript site that renders topology JSON directly into one SVG. `src/layout.ts` currently supplies one wide coordinate system and `edgePath` derives Bézier endpoints from node rectangles. Scenario playback already owns hop timing and packet cleanup, while `src/style.css` owns the visual tokens and responsive presentation. See proposal.md and `specs/quality-floor/spec.md` for the quality contract.

## Goals / Non-Goals

**Goals:**

- Preserve the existing scenario scheduler and packet lifecycle while changing only the reduced-motion presentation.
- Make layout coordinates authoritative for both wide and stacked geometries, so edge paths are regenerated from the same node rectangles that are rendered.
- Keep topology and scenario content data-driven, including the assistive-technology description.
- Make the three workstreams independently reviewable and mergeable in the runbook's prescribed order.
- Verify the production build at the deployed base path, the 380px viewport, OS-level reduced motion, keyboard focus, and Lighthouse accessibility.

**Non-Goals:**

- No new framework, animation library, accessibility library, or test runner.
- No changes to topology meaning, scenario ordering, hop offsets, durations, or packet direction.
- No JavaScript media-query decision for reduced motion, no CSS-only correction layered over stale edge geometry, and no disabling or replacing scenarios for accessibility.

## Decisions

### Motion lane: CSS controls visibility; the scheduler controls time

Keep the packet and edge activity lifecycle driven by each hop's declared duration. Use the existing CSS `prefers-reduced-motion: reduce` branch to suppress the packet's visual travel and retain the edge's active stroke plus timed fade. Remove the packet module's JavaScript media-query branch rather than duplicating the preference in application state; the normal DOM/animation lifecycle still supplies deterministic cleanup and overlapping-hop timing. Captions continue through the existing scenario subscription while edge activity communicates progress without motion.

This is preferred over disabling playback because the scenario remains understandable, and over a JavaScript `matchMedia` branch because CSS already owns presentation preference and avoids a second source of truth. No change is made to scenario data or the Web Animations API contract.

### Responsive lane: select layout geometry in `src/layout.ts`

Extend the layout model with a wide arrangement and a stacked arrangement, selected from the available stage width. The stacked arrangement assigns the three zones consecutive vertical bands with horizontal inner space sized for the narrow viewport; `getNodePositions`, `getNodeRects`, and `edgePath` consume that arrangement. Re-render or update the SVG geometry when the stage crosses the layout threshold so every edge is recalculated from current source and destination rectangles, including cross-zone edges.

Use the existing SVG and DOM rather than a CSS transform or a second SVG overlay. Remove the desktop minimum-width assumption that prevents 380px use. Keep inspector content in the same DOM surface and switch its positioning to a bottom sheet only in the narrow CSS media query; the layout model, not that CSS, owns edge routing.

The resize path must be idempotent and must not alter playback state or packet animation. Existing node-control event handling and selected-node references must survive a geometry refresh, or be rebound from the refreshed SVG in one place.

### Accessibility lane: describe the rendered data at render time

Generate a concise description from `topology.zones`, `topology.nodes`, and `topology.edges` in the same render path that builds the SVG. Include zone labels, node labels, and readable source-to-destination connection statements; escape all inserted data. Attach stable IDs to the SVG title/description and reference them with the SVG's accessible role/name attributes. Keep node controls individually named and keyboard-focusable, and retain the existing inspector focus/dimming semantics.

Audit the existing muted token against the substrate/surface and adjust the shared CSS custom property rather than adding one-off colors. Keep a high-contrast `:focus-visible` treatment for scenario buttons, inspector controls, and SVG node controls in both layout modes. Use text labels in addition to any color cues.

This is preferred over a hand-written summary because topology edits otherwise make the accessible description stale, and over a separate accessibility dependency because native SVG/DOM semantics, CSS, and the existing data loader are sufficient. No dependency is added. All output is deterministic from JSON; no `Math.random()` or time-derived content is introduced.

### Worktree ownership and merge order

- **Motion worktree (`phase-8-motion`)** owns reduced-motion behavior in the packet presentation and its CSS rules; it must not change layout geometry or responsive inspector rules.
- **Responsive worktree (`phase-8-responsive`)** owns `src/layout.ts`, responsive stage/styles, and the geometry refresh needed for stacked zones; it must not change packet/scenario animation behavior.
- **Accessibility worktree (`phase-8-a11y`)** owns generated SVG description/semantics and contrast/focus styling; it must preserve the motion and layout behavior already merged.

Merge in motion, responsive, accessibility order. Resolve shared `main.ts`/`style.css` changes by retaining all three contracts, then run the combined checkpoint on the merged result rather than trusting isolated worktree checks.

## Risks / Trade-offs

- **[Risk]** Hiding packets with CSS while retaining their timed lifecycle could be mistaken for motion by automated inspection → **Mitigation:** verify no packet is visually present under the OS reduced-motion setting, verify each edge highlight/fade and caption transition, and keep all hop timing unchanged.
- **[Risk]** A layout refresh could invalidate node/inspector DOM references or leave stale paths during playback → **Mitigation:** centralize geometry refresh, preserve selected node state, rebind maps/listeners safely, and run resize checks both idle and during a scenario.
- **[Risk]** Stacked cross-zone paths may overlap nodes or zone labels → **Mitigation:** derive anchors from final node rectangles, test representative edges in both directions, and inspect the full topology at 380px and just below the threshold.
- **[Risk]** SVG labels and interactive descendants can create conflicting assistive-technology semantics → **Mitigation:** use one labelled SVG group with generated title/description, explicit names on node controls, `aria-hidden` only while the modal inspector is open, and validate with Lighthouse plus a screen reader walkthrough.
- **[Risk]** Adjusting the shared muted token can affect visual hierarchy → **Mitigation:** change only as much as required for contrast and review all muted uses on substrate and surface backgrounds.

## Migration Plan

1. Capture a baseline Lighthouse accessibility score and record the current visual behavior at desktop and 380px before starting the worktrees.
2. Implement and verify the motion lane, including the OS reduced-motion toggle rather than a simulated media query.
3. Implement and verify the responsive lane, documenting how edges crossing stacked zones are anchored and routed from the layout model.
4. Implement and verify the accessibility lane, including the topology-data-derived description, contrast, focus visibility, and baseline/after Lighthouse scores.
5. Merge the worktrees in motion, responsive, accessibility order; run `npm run validate` and `npm run build`, then repeat the combined manual and Lighthouse checks at the deployed base path.
6. Roll back by reverting the quality worktree commits; topology/scenario JSON and the pre-existing playback contract remain intact.
