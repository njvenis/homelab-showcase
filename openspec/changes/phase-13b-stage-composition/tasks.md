## 0. Baseline

- [x] 0.1 Capture screenshots at 390, 768, 1024 and 1440 in four states — idle, scenario running, node selected, reduced motion — into `tests/visual/baseline/`. Commit. Verify sixteen non-empty files.
- [x] 0.2 Record the current fold measurement at 1440×900 using the spec's snippet. Note the number in the commit message.

## 1. Tokens

- [ ] 1.1 Add the ten tokens from the spec table to `:root` with exact values. Verify each with a grep returning one line; diff the `:root` block to confirm no existing value changed.
- [ ] 1.2 After packages 2–6, confirm every added token has a consumer outside `:root`. Remove any that does not and say which.

## 2. Masthead compression

- [ ] 2.1 Apply the five declaration changes named in the spec.
- [ ] 2.2 Measure the fold using the spec's snippet at 1440×900: `r.top ≤ 340` and `Math.min(r.bottom, 900) - r.top ≥ 400`. Repeat at 1024×768 expecting `r.top ≤ 300`. Record both against the 0.2 baseline.
- [ ] 2.3 Apply masthead padding reductions at ≤768px, ≤390px and `(max-height: 480px)`. Verify no title overflow at 320px.
- [ ] 2.4 If `--text-hero` is now unreferenced, remove it and note the removal; otherwise leave it and say which selector uses it.

## 3. Control column

- [ ] 3.1 In `src/main.ts` shell assembly (~194–213), wrap the scenario rail, flow key and detail panel in a single `.control-column` element placed as a sibling of `.topology-stage` inside `.interaction-shell`. Build the markup in the string assembly, not `index.html`. Do not change the render functions' internals.
- [ ] 3.2 Make `.interaction-shell` a grid at `min-width: 1024px` per the spec. Before accepting, recompute the spec's width arithmetic against the shell padding and gap you actually used, and confirm the stage column is ≥ `--measure-stage-min` at 1024px. Record the numbers.
- [ ] 3.3 Verify two grid tracks resolve at 1024px and 1440px, one track at 900px and 769px.
- [ ] 3.4 Implement the ≥1440px cap and verify at 1920px.
- [ ] 3.5 Implement the narrow-stage fallback. Verify `scrollWidth === clientWidth` at 320, 390, 640, 768, 900, 1024, 1280, 1440, 1920.
- [ ] 3.6 At ≤1023px make the scenario list a horizontal rail with `scroll-snap-type: x proximity`, `overscroll-behavior-inline: contain` and `scroll-margin-inline: var(--space-4)` on entries. Verify each entry's focus ring is fully visible when focused by keyboard at 768px.

## 4. Node detail as a panel

- [ ] 4.1 Move the detail element into `.control-column`. Remove `role="dialog"`, `aria-modal="true"` and `aria-live="polite"`; set `role="region"` with an accessible name from its heading.
- [ ] 4.2 Remove the `closeInspectorButton.focus()` call on open (`src/main.ts` ~337). Verify that opening detail from node `swap` by Enter leaves `document.activeElement` as the `swap` node with the panel visible and populated.
- [ ] 4.3 Verify focus return on Escape and on the close control still works — the `phase-13a` contract must survive.
- [ ] 4.4 Verify the panel does not trap: Tab from its close control moves to the next focusable element in DOM order outside it.
- [ ] 4.5 Delete `.canvas-dimmer` from `src/main.ts` and `src/style.css`. Verify `document.querySelector('.canvas-dimmer')` is null and `grep -rn 'canvas-dimmer' src/ index.html` is empty.
- [ ] 4.6 Make the panel replace the flow key while open and restore it on dismissal at ≥1024px. Verify the flow key matches no `a, button, input, select, textarea, [tabindex]` selector.
- [ ] 4.7 Verify non-occlusion at 1440px: the panel's rect does not intersect the SVG's rect.
- [ ] 4.8 At ≤1023px render detail inline below the stage; at ≤390px as a bottom sheet ≤60% viewport height with `overscroll-behavior: contain`, top edge below the SVG's visible midpoint. Verify sheet scroll does not chain to the page.

## 5. Responsive and stacked layout

- [ ] 5.1 Change `STACK_ROW_PITCH` to 42, `STACK_HEADER` to 40, `STACK_ZONE_GAP` to 20 in `src/layout.ts`. Leave `STACK_TOP` and `NODE_HEIGHT` alone. Recompute the spec's derivation against the values you set and confirm ≤ 1200.
- [ ] 5.2 Verify at 390×844 the SVG `viewBox` height is ≤ 1200, all `topology.nodes.length` node labels and 3 zone labels are present, and adjacent label bounding boxes clear each other by ≥ 6px.
- [ ] 5.3 Implement the `(max-height: 480px)` rule. Verify at 844×390 that ≥200px of SVG is in view with no horizontal overflow.
- [ ] 5.4 Verify the 769–1023px band renders the single-column arrangement.

## 6. States

- [ ] 6.1 Add the loading skeleton at the stage's aspect ratio in `var(--surface)`. No spinner, no network-implying text.
- [ ] 6.2 Move the topology and scenario data import behind a dynamic `import()` in a `try`/`catch` in `src/main.ts`. Verify a broken edge reference produces a stage-region message naming that id, with masthead, Decisions and footer still rendering and no unhandled exception in the console. Restore the data afterwards.
- [ ] 6.3 Add the empty state for an empty `scenarios` array: replacement sentence, no idle tour, topology still rendering. Verify by temporarily emptying the array, then restore.
- [ ] 6.4 Implement hover as border weight only. Verify computed `transform`, `box-shadow` and `scale` are `none`, `none`, `1`.
- [ ] 6.5 Implement pressed as a background step to `var(--surface-2)`. No transform.
- [ ] 6.6 Implement disabled for engine-initialisation failure only. Confirm it is never used to mean "already playing".
- [ ] 6.7 Implement re-activation as restart-from-zero. Verify ten rapid activations leave no `circle.packet` from a cancelled run and no `path.edge` with a residual inline `stroke`.
- [ ] 6.8 Verify edges have no hover affordance and their `pointer-events` are unchanged.
- [ ] 6.9 Verify the detail panel's computed `transition-duration` is `0s` under `prefers-reduced-motion`.

## 7. Verification and regression

- [ ] 7.1 `npx tsc --noEmit`, `npm run validate`, `npm run build` all pass.
- [ ] 7.2 Raw-length audit: `grep -nE '[0-9]+(\.[0-9]+)?(rem|px|em)' src/style.css | grep -v ':root'`, classify every hit. Zero `font-size`, `margin` or `padding` leaks.
- [ ] 7.3 Colour audit: `grep -rEn '#[0-9a-fA-F]{3,6}' src/ --include='*.ts' --include='*.css' | grep -v ':root'` returns nothing.
- [ ] 7.4 Composition regression at 1440px: Flows and Decisions still two-column with sticky `var(--text-2xl)` Fraunces headings and flow-row accent bars.
- [ ] 7.5 Keyboard regression: exactly one `[data-node-id][tabindex="0"]`; Tab into the SVG then Tab again leaves it.
- [ ] 7.6 Packet regression: play all five scenarios and confirm packets travel, edges highlight and fade-back settles as before. Compare against the 0.1 running-state baselines.
- [ ] 7.7 Reduced motion, toggled at OS level: no running `offset-distance` animation; edges highlight in hop order; caption updates; idle tour does not start.
- [ ] 7.8 axe or Lighthouse at 390px and 1440px: score 100, no contrast violations.
- [ ] 7.9 Console: built site, all five scenarios, three node selections, resize across all nine widths. Zero `console.error`.
- [ ] 7.10 Copy audit against the prohibited-term list.
- [ ] 7.11 `npm run build`, serve `dist/` from a subdirectory, confirm every asset resolves.
- [ ] 7.12 Confirm the diff excludes `src/packet.ts`, `src/scenario.ts`, `src/types.ts`, `src/data/*`, `vite.config.ts` and `.github/workflows/deploy.yml`.
- [ ] 7.13 Screenshots at four widths × four states, diffed against baselines. Review material, not a pass/fail gate.
