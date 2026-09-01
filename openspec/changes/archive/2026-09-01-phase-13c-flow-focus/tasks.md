## 1. Tokens and wrappers

- [x] 1.1 Add `--dim-inactive-edge`, `--dim-inactive-node`, `--zone-context-fill` and `--motion-base` to `:root` with exact values. Diff the `:root` block to confirm no existing value changed.
- [x] 1.2 In `renderTopology` (`src/main.ts` ~130–141), wrap each edge's two paths in `<g class="edge-group" data-edge-id="{id}">`. Do not alter any inner element's class, id, `data-edge-id`, marker attribute or `d`.
- [x] 1.3 Do NOT add a node wrapper. Confirm `document.querySelectorAll('[data-node-id]').length` is 21 and each result is a `g.node-control`.
- [x] 1.4 Verify `document.querySelectorAll('path.edge').length` and `document.querySelectorAll('.edge-glow[data-edge-id]').length` both equal 21, and every `path.edge` id equals its group's `data-edge-id`.
- [x] 1.5 Verify every `g.edge-group` precedes every `g.node-control` in document order.
- [x] 1.6 Play all five scenarios and confirm packets travel, edges highlight and fade-back settles exactly as before wrapping. Compare against the running-state baselines.
- [x] 1.7 Confirm `src/packet.ts` is absent from the diff.

## 2. Focus states

- [x] 2.1 In `src/scenario.ts`, expose the running scenario's participating edge id set and current hop index on the subscribable state. Do not alter timing, ordering or hop semantics.
- [x] 2.2 Implement playback focus as `opacity` on `g.edge-group` and `g.node-control` only, over `var(--motion-base)` with `var(--ease-out)`. Verify with `off-network-access`.
- [x] 2.3 Implement selection focus over incident edges and adjacent nodes. Verify with node `swap`.
- [x] 2.4 Implement precedence: selection wins; the running scenario is never stopped, paused or restarted by selection; dismissal restores playback focus if still running. Verify by selecting a node mid-`discord-task` and confirming hop firing times are unaffected.
- [x] 2.5 Make node selection stop the idle tour permanently for the session. Verify the tour does not advance after a selection.
- [x] 2.6 Suppress arrival pulses on dimmed node controls. Verify a pulse fires only on controls at full opacity.
- [x] 2.7 Verify no rule sets `opacity`, `stroke`, `display`, `offset-path`, `offset-distance` or `--packet-flow` on `path.edge`, `path.edge-glow` or `circle.packet`.
- [x] 2.8 Verify every `circle.packet` is a direct child of the `svg` element and none has computed opacity below 1, including while a node is selected mid-playback.
- [x] 2.9 Verify all 21 edge groups and 21 node controls return to opacity 1 after a scenario completes with nothing selected.
- [x] 2.10 Exempt node labels from group dimming. Measure a dimmed node label's contrast against the substrate and confirm AA.

## 3. Scenario metadata

- [x] 3.1 Compute hop count as `hops.length` and duration as `max(at + duration)`; render `{n} hops` and `runtime {s}s` in mono at `var(--text-xs)`. Verify `health-sweep` reads `2 hops` / `runtime 0.8s` and `discord-task` reads `17 hops` / `runtime 6.4s`.
- [x] 3.2 Guard the empty hop array: zero hops renders `0 hops` with no runtime figure and is not playable. Verify by temporarily emptying one scenario's hops that the string `Infinity` appears nowhere in the document and activating it neither starts playback nor throws. Restore.
- [x] 3.3 Confirm no hop-count or duration literal was written into any file under `src/data/`.
- [x] 3.4 Give the scenario list a heading containing the word "Scripted".

## 4. Path readout

- [x] 4.1 Render the selected scenario's full ordered hop list in `.control-column`, ascending `at` order, one row per hop. Never newest-first, no timestamps, no counters, no scrollback.
- [x] 4.2 Each row shows the edge's declared `from` label, an arrow, and its `to` label — never swapped — plus a distinct reverse indicator where `reverse: true`. Verify against a scenario containing a reverse hop.
- [x] 4.3 Mark the current hop's row with `var(--surface-2)` and a left accent in the hop's flow colour over `var(--motion-slow)`. Verify exactly one row marked mid-run, none after completion, order unchanged.
- [x] 4.4 Name the readout region via `aria-labelledby` from its own heading. Verify it has no `aria-live`, `role="log"` or `role="status"`, and that no scenario entry references it via `aria-describedby`.
- [x] 4.5 Verify the marked row's computed `transition-duration` is `0s` under `prefers-reduced-motion`.

## 5. Zone emphasis

- [x] 5.1 Add `emphasis?: 'primary' | 'context'` to `Zone` in `src/types.ts`.
- [x] 5.2 Validate in `src/data/load.ts` and `scripts/validate.ts`, rejecting any other value and naming the zone id and value. Verify by setting `"emphasis": "secondary"` that both paths fail; restore.
- [x] 5.3 Set `"emphasis": "context"` on `ext` only. Leave `pi` and `wsl` without the field.
- [x] 5.4 Render context zones with a dashed `var(--border-hair)` boundary, `var(--zone-context-fill)` fill and `var(--ink-muted)` labels. Verify the computed fill, stroke and stroke-dasharray of `pi` and `wsl` are unchanged from baseline.
- [x] 5.5 Measure context-zone label and sub-label contrast against `var(--zone-context-fill)`; confirm AA.

## 6. Legend and validation guard

- [x] 6.1 Derive legend entries from distinct `kind` values in `topology.json` **edges**, in the canonical order `control, infer, memory, health, network, egress`, filtered to those present. Remove the `legendEntries` literal array.
- [x] 6.2 Verify by temporarily removing all `egress` edges that the legend shows five entries in canonical order; restore and confirm six.
- [x] 6.3 Add the zone-layout coverage guard to `scripts/validate.ts`. Verify by adding a fourth zone with no layout entry that validate exits non-zero, names the zone id, and states a layout entry is missing; revert.

## 7. Verification and regression

- [x] 7.1 `npx tsc --noEmit`, `npm run validate`, `npm run build` all pass.
- [x] 7.2 `grep -rn 'Math.random' src/` returns nothing; a scenario played twice fires hops at identical offsets.
- [x] 7.3 Raw-length audit and colour audit both clean.
- [x] 7.4 Data-model regression: `reverse: true` on `n8n-resend` still fails validate naming hop and edge; restore.
- [x] 7.5 Stage-composition regression: fold `top ≤ 340` at 1440×900 under the documented measurement procedure; Flows and Decisions still two-column with sticky headings.
- [x] 7.6 Keyboard regression: exactly one `[data-node-id][tabindex="0"]`; Escape from detail returns focus to the invoking node.
- [x] 7.7 Reduced motion, toggled at OS level: dimming applied with `0s` transitions; readout marking instant; no running `offset-distance` animation; edges highlight in hop order; caption and readout update; idle tour does not start.
- [x] 7.8 axe or Lighthouse at 390px and 1440px: score 100, no contrast violations.
- [x] 7.9 Console: built site, all five scenarios, three node selections, selection during playback, resize across all nine widths. Zero `console.error`.
- [x] 7.10 Copy audit against the prohibited-term list; every duration prefixed `runtime`; list heading names the flows as scripted.
- [x] 7.11 Confirm the diff excludes `src/packet.ts`, `src/layout.ts`, `index.html`, `src/data/scenarios.json`, `src/data/flow-content.json`, `src/data/readout.json`, `vite.config.ts`, `.github/workflows/deploy.yml`.
- [x] 7.12 Screenshots at four widths × four states, diffed against baselines. Review material, not a pass/fail gate.
