## 1. Token foundation

- [x] 1.1 Add `--surface-2`, `--flow-network`, `--edge-idle-*`, and `--bloom-*` to the shared token block; lift `--ink-muted` to `#93A5B5` and leave all existing full flow hues unchanged. Verify `grep -rE '#[0-9a-fA-F]{3,6}' src/` reports literals only in the token block and `npm run build` succeeds.
- [x] 1.2 Add deterministic kind mappings for idle edge, node tint/accent, and network packet presentation without adding dependencies or `Math.random()`. Verify all six kinds resolve to the expected CSS variables and `grep -r 'Math.random' src/` returns no matches.

## 2. Lit topology presentation

- [x] 2.1 Render one non-semantic, pointer-transparent duplicate SVG path per edge for the low-alpha same-hue glow; add the single two-dominant-hue radial stage bloom behind the diagram and preserve node substrate fills, 3px 60%-opacity kind accents, 6% kind tints, and transitional dashes. Verify the idle SVG has one base/glow pair per edge, no dot grid or vignette, and labels/focus indicators remain readable.
- [x] 2.2 Update packet activity so base and glow paths brighten to the full edge kind hue, retain reference counting for overlap, and fade both back to the correct idle token using the existing fade duration. Verify normal, reverse, overlapping, cancellation, and network packets leave no stuck highlight or stale glow.

## 3. Tour, arrival, and progress behavior

- [x] 3.1 Implement the exact idle tour from `docs/v2-lit.md`: 2500ms initial delay, `scenarios.json` order, 3000ms rest, indefinite looping, and permanent session stop on scenario-button click, node click, keypress, or play control; never start under reduced motion. Verify each boundary and that tour-owned playback cancels without disabling manual play.
- [x] 3.2 Drive 400ms 1.5 → 3 → 1.5 destination-border arrival pulses from packet completion, restart concurrent pulses, and implement the running button's 2px elapsed-time progress bar from `max(at + duration)`; reset on stop and step per hop under reduced motion. Verify normal/reduced motion arrival, caption, progress, and completion behavior.

## 4. Legend, headings, and cleanup

- [x] 4.1 Expand the legend to exactly six labelled entries, including network, and replace circular swatches with short lit dash previews using each full flow hue and faint same-hue glow. Verify meanings remain available as text and all entries are keyboard/screen-reader understandable without colour perception.
- [x] 4.2 Remove every `.section-kicker` element and style; fold informative kicker copy into adjacent headings and delete redundant copy. Delete `src/counter.ts` and verify no source import or build reference remains.

## 5. Integration verification

- [x] 5.1 Run `npm run validate` and `npm run build`, then verify the deployed-base-path page at desktop and 380px: idle edges are kind-lit, active edges brighten and fade, nodes retain transitional dashes, the bloom is barely perceptible, the six-entry legend is present, and no console errors or horizontal overflow occur.
- [x] 5.2 Verify keyboard traversal, inspector readability, focus visibility, contrast over substrate/surface/surface-2/bloom, and Lighthouse accessibility 100; confirm all flow meaning has a text/non-colour cue and no lit treatment sinks text contrast.

## 6. Runbook Step 6 v2-lit checkpoint

- [x] 6.1 Complete the runbook Step 6 design-system checkpoint and the v2 verification prompt: confirm `grep -rE '#[0-9a-fA-F]{3,6}' src/` finds colour literals only in the token block, observe a quiet permanently lit topology after five idle seconds, play off-network access with steel packets/pulses and six legend entries, toggle the OS reduced-motion setting to confirm no tour or travel but colour-step pulses and full usability, report Lighthouse accessibility 100, and tab through the full page.
