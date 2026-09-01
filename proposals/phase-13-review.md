# Implementation-readiness review — phase-13

Reviewed against `157da44` on the assumption the implementer is a local-inference agent with no access to this conversation and no authority to reinterpret design intent. Twenty-three findings. Nothing here has been implemented or tested.

**Outcome: the proposal is not ready as a single change and has two requirements that contradict the existing DOM.** It has been split into three changes — `phase-13a-a11y-correctness`, `phase-13b-stage-composition`, `phase-13c-flow-focus` — and the defects below are fixed in them.

---

## 1. Blocking ambiguities

**1.1 — The node wrapper requirement duplicates an element that already exists.** *(blocking)*
`src/main.ts:151` already renders every node inside `<g class="node-control" data-node-id="…" role="button" tabindex="0" aria-label="…">`. The spec required adding `<g class="node-group" data-node-id="{id}">`. An implementer following it literally produces two nested elements both carrying `data-node-id`, which breaks the `nodeControls` map populated at line 244 and the arrival-pulse lookup at line 602, and silently doubles every node in any `[data-node-id]` query.
**Fixed:** node dimming targets the existing `g.node-control`. Only edges gain a wrapper, because edges genuinely have none — they are two flat sibling paths.

**1.2 — Focus behaviour when the detail panel opens is unspecified.** *(blocking)*
`src/main.ts:337` currently calls `closeInspectorButton.focus()` on open, which is correct for a modal and wrong for a non-modal region: it would steal focus from the diagram every time a node is activated, including by mouse. The spec removed `aria-modal` without saying what replaces the focus behaviour.
**Fixed:** on open, focus stays on the invoking node; the panel is not auto-focused. Escape and the close control both return focus to the invoking node. Stated with scenarios.

**1.3 — `max(at + duration)` is undefined for an empty hop array.** A scenario with no hops yields `-Infinity`, rendering `runtime -Infinitys`.
**Fixed:** a scenario with zero hops renders `0 hops` and no runtime figure, and is not playable.

**1.4 — Path readout row labels for reverse hops.** The spec said "from-label and to-label" without saying whether a `reverse: true` hop displays them swapped.
**Fixed:** rows always show the edge's declared `from → to` with a distinct reverse indicator; labels are never swapped, so the row identifies the edge rather than the direction of travel.

**1.5 — An unresolved either/or was left inside a requirement.** "Text inside a dimmed group SHALL be exempted from dimming, **or** the dimming requirement SHALL be revised" hands the implementer a design decision.
**Fixed:** two tokens — `--dim-inactive-edge: 0.35` and `--dim-inactive-node: 0.55` — with node labels exempted from group opacity. The contrast obligation is now a measurement, not a choice.

**1.6 — "Headless viewport" names no tool**, and the measurement API differs between Playwright and Puppeteer.
**Fixed:** the exact measurement snippet is in the spec; any headless browser that can run it is acceptable.

---

## 2. Requirements that are too subjective

**2.1** — "It is the score, not the performance" sat inside a requirement body. Rationale, not testable. Moved to `design.md`.

**2.2** — "No lift, no shadow, no scale" was only testable for transform.
**Fixed:** the acceptance scenario now reads computed `transform`, `box-shadow` and `scale` and requires `none`, `none` and `1`.

**2.3** — "Premium", "tactile", "field guide" appear in Purpose prose. Acceptable as framing; confirmed absent from every requirement body and acceptance criterion.

**2.4** — "Felt not seen" language from the v2 direction did not leak into this proposal. No action.

---

## 3. Missing file-level guidance

`src/main.ts` is 771 lines and the tasks named behaviours without naming owners. An agent would have to rediscover the structure.
**Fixed:** each change now carries a file-and-function map — `renderTopology` (edges ~130, nodes ~143, SVG assembly ~160), `renderScenarioRail` (~163), `renderLegend` (~182), shell assembly (~194), `nodeControls` map (~227–244), inspector open/close (~289–352), arrival pulse (~602), tour and subscribe handler (~700–720), readout (~767).

Also added: markup for the control column is constructed in `src/main.ts` string assembly, not in `index.html`, matching how the rail and legend are already built.

---

## 4. Regressions to scenario playback and packet animation

**4.1 — Packets are appended to the SVG root** (`src/packet.ts:149`, `svg.append(packet)`), not into any edge group. Wrapping edges therefore cannot dim packets. This is the desired outcome but was never stated, so an implementer might "fix" it by moving packets into groups.
**Fixed:** the spec states packets are never dimmed and must remain children of the SVG root.

**4.2 — Edge wrapping changes sibling order** relative to nodes if done carelessly. `renderTopology` concatenates `zoneEls + edgeEls + nodeEls`; edges must stay in that band or nodes will render beneath edges.
**Fixed:** stated, with an acceptance check that node elements still follow all edge elements in document order.

**4.3 — Reference-counted fade-back across restart** is the subtlest existing behaviour. Ten rapid activations is specified; added an explicit check that no `path.edge` retains an inline `stroke` after a cancelled run, since that is how a leak would present.

**4.4 — `--packet-flow` and `offset-path` are set inline** by `packet.ts`. No new rule may set `offset-path`, `offset-distance` or `--packet-flow`. Added to the prohibition list.

---

## 5. Regressions to reduced-motion behaviour

**5.1 — Path-readout step marking transitions over `--motion-slow`** and the reduced-motion block did not cover it.
**Fixed:** under reduced motion the marking is instant.

**5.2 — Selection may kill the idle tour.** The tour stops permanently on any user interaction. Node selection is now a richer interaction than before, and the spec never said whether it counts.
**Fixed:** it counts — selecting a node stops the tour permanently, consistent with existing behaviour. Stated explicitly so the implementer does not have to infer it.

**5.3 — Focus dimming under reduced motion** was specified as instant. Confirmed adequate. Added a check that no `transition-duration` on a dimmed group is non-zero under the media query.

---

## 6. Regressions to accessibility and keyboard navigation

**6.1 — Roving tabindex is a modification to shipped behaviour, not an addition.** Every node currently carries `tabindex="0"`. This was filed as an ADDED requirement in a new capability, which misrepresents the delta and hides the regression risk from anyone reading the archive later.
**Fixed:** filed as a MODIFIED requirement against the `interaction` capability, with the current behaviour stated so the change is legible.

**6.2 — Removing `aria-modal` removes focus containment**, and Tab order out of the panel was unspecified.
**Fixed:** tab order after the panel continues to the next control-column element in DOM order; the panel does not trap.

**6.3 — Swapping the flow key for the detail panel can destroy focus** if focus is inside the flow key when a node is activated.
**Fixed:** the flow key contains no focusable elements, which is stated as a constraint so the swap stays safe; if that ever changes, focus must be moved before the swap.

**6.4 — `aria-describedby` from a scenario entry to the whole path readout** would make a screen reader announce every hop row as the entry's description. Verbose and unhelpful.
**Fixed:** removed. The readout is a labelled region referenced by `aria-labelledby` from its own heading.

**6.5 — Touch target size** was never stated. `NODE_HEIGHT` is 36px, above the 24px AA minimum but below the 44px AAA target.
**Fixed:** stated as meeting AA with the figure recorded, so it is a known position rather than an accident.

---

## 7. Mobile layout risks

**7.1 — `STACK_ROW_PITCH` 44 against `NODE_HEIGHT` 36 leaves an 8px gutter.** Adjacent node labels may visually collide even though the boxes do not overlap.
**Fixed:** the acceptance criterion now checks label bounding boxes, not node boxes, and requires ≥6px clearance between adjacent labels.

**7.2 — `scroll-snap-type: x mandatory` fights keyboard focus scrolling.** Mandatory snapping can prevent a focused element from being scrolled fully into view even with `scroll-margin`.
**Fixed:** changed to `proximity`, with `scroll-margin-inline` retained.

**7.3 — Three scroll contexts at ≤390px** — page, snap rail, bottom sheet. Risk of scroll chaining and trapped gestures.
**Fixed:** `overscroll-behavior: contain` required on the rail and the sheet, with an acceptance check that page scroll is not blocked while either is at its extent.

**7.4 — Landscape at 844×390 with a bottom sheet** capped at 60% of a 390px viewport leaves 156px of sheet. Tight but usable; the short-viewport rule already reduces masthead padding. Noted, not blocked.

---

## 8. Scope that should be split

The single change carried 18 requirements, 46 scenarios and 77 tasks across accessibility correctness, page composition, and new interaction behaviour. That is too large for one review gate, and it holds a live accessibility defect hostage behind a design change.

**Split into three, in dependency order:**

| Change | Contents | Ships |
|---|---|---|
| `phase-13a-a11y-correctness` | live-region fix, static-readout attributes, roving tabindex, focus-return, keyboard model | Immediately. No visual change, no design review needed |
| `phase-13b-stage-composition` | masthead compression, two-column shell, control column, detail panel, responsive ranges, stacked-layout constants, states | After 13a |
| `phase-13c-flow-focus` | edge group wrappers, selection and playback focus, path readout, scenario metadata, zone emphasis, legend derivation, validation guard | After 13b |

13a is independently valuable and independently revertible. 13c depends on 13b's control column existing. Each has its own regression gate.

---

## 9. Ordered implementation checklist

Full task lists live in each change. The order across all three:

1. Capture visual baselines at 4 widths × 4 states; record the current fold measurement and accessibility scores.
2. **13a** — live region to one announcement per scenario; remove `role="status"` from the readout; roving tabindex on nodes and the scenario list; focus return on Escape and close. Verify, commit, archive.
3. **13b** — tokens; masthead compression and fold measurement; `.control-column` wrapper; two-column grid with the width arithmetic rechecked; detail panel out of the stage and `.canvas-dimmer` deleted; responsive ranges including stacked constants; loading, empty, error, hover, pressed, disabled, re-activation states. Verify, commit, archive.
4. **13c** — edge group wrappers and packet-selector verification; scenario state exposes participating edges and current hop; playback focus; selection focus and precedence; pulse suppression; scenario metadata; path readout; zone emphasis; legend derivation; validation guard. Verify, commit, archive.
5. Full regression pass, screenshot diff review against baselines, deploy preview.

---

## 10. Tests the implementing agent must run

Per change, before its checkpoint. None of these has been run.

**Build and data**
- `npx tsc --noEmit`
- `npm run validate`
- `npm run build`
- Deliberate broken edge reference → validate exits non-zero naming the id; restore
- Deliberate `reverse: true` on `n8n-resend` → validate fails naming hop and edge; restore
- Deliberate `"emphasis": "secondary"` → both loader and validate fail naming the zone; restore *(13c)*
- Deliberate fourth zone with no layout entry → validate fails naming it; restore *(13c)*

**Static audits**
- `grep -nE '[0-9]+(\.[0-9]+)?(rem|px|em)' src/style.css | grep -v ':root'` — classify every hit
- `grep -rEn '#[0-9a-fA-F]{3,6}' src/ --include='*.ts' --include='*.css' | grep -v ':root'` — empty
- `grep -rn 'Math.random' src/` — empty
- `grep -rn 'canvas-dimmer' src/ index.html` — empty *(13b)*
- Diff file list excludes `src/packet.ts`, `src/data/scenarios.json`, `vite.config.ts`, `.github/workflows/deploy.yml`

**Browser, per width 320 / 390 / 640 / 768 / 900 / 1024 / 1280 / 1440 / 1920**
- `scrollWidth === clientWidth`
- Zero `console.error` after playing all five scenarios and selecting three nodes

**Measured**
- Fold: `top ≤ 340` at 1440×900 and `≤ 300` at 1024×768, DPR 1, `scrollY === 0`, after `await document.fonts.ready` *(13b)*
- Stacked `viewBox` height ≤ 1200 at 390×844, adjacent label clearance ≥ 6px *(13b)*
- `document.querySelectorAll('path.edge').length === 21` after edge wrapping *(13c)*
- Exactly one `[data-node-id][tabindex="0"]` *(13a)*
- `MutationObserver` on the live region: exactly two mutations across `discord-task`'s 17 arrivals *(13a)*
- Ten rapid re-activations leave no orphaned `circle.packet` and no residual inline `stroke` *(13b)*

**Keyboard**
- Tab into SVG, Tab again → focus leaves the SVG *(13a)*
- ArrowRight ×20 from the first node → each of 21 nodes focused once with a visible ring *(13a)*
- Escape from detail → `document.activeElement` is the invoking node *(13a)*
- Full page traversal by Tab alone, no trap, no unreachable control

**Reduced motion — toggle the OS setting, not the media query**
- No `circle.packet` with a running `offset-distance` animation
- Edges highlight in hop order; caption and path readout update
- Focus dimming and readout marking have zero transition duration
- Idle tour does not start

**Accessibility**
- axe or Lighthouse at 390px and 1440px, score 100, no contrast violations
- Context-zone label contrast against `--zone-context-fill` measured explicitly *(13c)*
- Dimmed node label contrast measured explicitly *(13c)*

**Visual**
- Screenshots at 4 widths × 4 states, diffed against baselines. Review material, not a pass/fail gate.
