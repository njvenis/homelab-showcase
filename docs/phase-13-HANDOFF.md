# Implementation Handoff

**Read this before starting. It governs all three changes.**

---

## Role boundary

> The local coding agent implements the approved OpenSpec proposal. Claude is the specification and design author, not the frontend builder.

This has two consequences that bind the implementing agent:

**Do not invent product requirements.** If a behaviour is not in the spec, it is not in scope. If the spec appears to require a behaviour it does not define, stop and report it as an ambiguity rather than choosing on the design author's behalf.

**Do not redesign while implementing.** Visual, copy and interaction decisions were made in `design.md` for each change and the reasoning is recorded there. An implementation that produces a different result because it looked better is a failed implementation even if the result is good.

Where the spec deliberately leaves a choice open, it is listed under **Implementation decisions** below with a recommended default. Take the default unless you have a concrete reason not to, and report which you took either way.

---

## 1. Order of work

Strictly sequential. Each change is proposed, applied, verified, committed and archived before the next begins.

| # | Change | Why this position |
|---|---|---|
| 0 | Baseline capture | Screenshot review later has nothing to compare against otherwise |
| 1 | `phase-13a-a11y-correctness` | Fixes a live defect. No visual change, so it needs no design review and can ship alone |
| 2 | `phase-13b-stage-composition` | Depends on 13a's focus-return contract. Creates `.control-column` |
| 3 | `phase-13c-flow-focus` | Depends on 13b's `.control-column` existing |

Do not begin a change while the previous one has an unresolved failing check. Do not combine two changes into one branch.

Per change: `/opsx-propose <name>` → read all four artefacts → commit specs on `main` → branch → `/opsx-apply` → verify → merge `--no-ff` → tag → `/opsx-archive`.

---

## 2. Files to inspect before each change

Read these before writing anything. Do not modify them during inspection.

**Before all changes**
- `README.md`, `DECISIONS.md` — the direction model (`bidirectional` on edges, `reverse` on hops) and why it is not two edges
- `openspec/specs/data-model/spec.md` — invariants that must keep holding
- `docs/v2-lit.md` — the lit treatment this work must not disturb
- `src/types.ts` — 49 lines, the whole data contract

**Before 13a**
- `src/main.ts` lines ~143–160 (node markup), ~227–244 (`nodeControls` map), ~289–352 (inspector open and close), ~700–720 (`subscribe` handler and tour)
- `index.html` — `#hero-readout` attributes

**Before 13b**
- `src/main.ts` lines ~163–213 (rail, legend, shell assembly, inspector markup)
- `src/style.css` — the `:root` block, `.page-header`, `.interaction-shell`, `.topology-stage`, `.inspector`, `.canvas-dimmer`, and all five existing `@media` blocks
- `src/layout.ts` lines ~18–60 (wide layout, stacked constants, `selectLayout`)
- `src/data/load.ts` — confirm for yourself that it throws at module scope; the error-state requirement depends on it

**Before 13c**
- `src/main.ts` lines ~128–141 (edge markup), ~143–158 (node markup), ~182–192 (`renderLegend` and the `legendEntries` literal), ~602 (arrival pulse lookup)
- `src/packet.ts` in full — 219 lines. You will not edit it, but you must know what it addresses and mutates before wrapping edges
- `src/scenario.ts` in full — 216 lines
- `scripts/validate.ts`

---

## 3. Files you may edit

Per change. Anything not listed for the change you are on is out of bounds for that change.

**13a** — `index.html`, `src/main.ts`

**13b** — `src/main.ts`, `src/style.css`, `src/layout.ts` (stacked constants only: `STACK_ROW_PITCH`, `STACK_HEADER`, `STACK_ZONE_GAP`), `index.html` (only if the dynamic-import restructure requires it)

**13c** — `src/main.ts`, `src/style.css`, `src/scenario.ts`, `src/types.ts`, `src/data/load.ts`, `src/data/topology.json`, `scripts/validate.ts`

**Any change** — `tests/visual/baseline/*` (baseline images), `openspec/**` (your own change artefacts)

---

## 4. Files you must not edit

**Never, in any of the three changes:**

- `src/packet.ts` — the reference-counted highlight and fade-back is the most fragile behaviour in the codebase, and every focus requirement is designed around not touching it. Its appearance in a diff is an automatic failure.
- `vite.config.ts` — the `base` path is what makes GitHub Pages work
- `.github/workflows/deploy.yml`
- `package.json` dependencies — no new dependency in any change
- `src/data/scenarios.json`, `src/data/flow-content.json`, `src/data/readout.json`
- `public/fonts/*`, `public/.nojekyll`
- Any archived change under `openspec/changes/archive/`

**Not edited unless the change you are on explicitly lists it in section 3.** In particular: `src/layout.ts`'s wide-layout zone rectangles are not restructured by any of these three changes, and `src/data/topology.json` is touched only by 13c and only to add `"emphasis": "context"` to the `ext` zone.

Temporary edits made to exercise a negative test — breaking an edge reference, emptying a hop array, adding a fourth zone — must be reverted before the milestone check, and the revert confirmed by a clean `git status`.

---

## 5. Commands after each milestone

Run in this order. A failure stops work; do not proceed to the next task with a red check.

**After every task that touches source**

```bash
npx tsc --noEmit
npm run validate
npm run build
```

**After each package within a change**

```bash
grep -rn 'Math.random' src/                                    # must be empty
grep -rEn '#[0-9a-fA-F]{3,6}' src/ --include='*.ts' --include='*.css' | grep -v ':root'   # must be empty
grep -nE '[0-9]+(\.[0-9]+)?(rem|px|em)' src/style.css | grep -v ':root'                   # classify every hit
git status --porcelain                                         # no stray temp edits
```

**Before merging any change**

```bash
git diff --name-only main..HEAD          # confirm against sections 3 and 4
npm run build && npx vite preview --port 4173
```

**13b and 13c additionally**

```bash
grep -rn 'canvas-dimmer' src/ index.html   # 13b: must be empty after package 4
git diff --name-only main..HEAD | grep -c 'src/packet.ts'   # must be 0
```

---

## 6. Visual states to inspect

Every state, at every viewport in section 7, for the change that touches it.

| State | How to reach it | Changes |
|---|---|---|
| Idle, tour running | Load, wait 3s, do not interact | all |
| Idle, reduced motion | OS reduced-motion on, load | all |
| Scenario running, mid-hop | Activate a scenario, observe at ~50% of its runtime | 13b, 13c |
| Scenario complete | Let a scenario finish, observe after settle | 13b, 13c |
| Node selected, nothing playing | Activate a node from idle | 13b, 13c |
| Node selected during playback | Activate a node mid-`discord-task` | 13c |
| Detail dismissed | Escape from the above | 13b, 13c |
| Loading skeleton | Throttle to Slow 3G, reload | 13b |
| Empty | Temporarily empty `scenarios.json`, revert after | 13b |
| Error | Temporarily break an edge reference, revert after | 13b |
| Hover | Pointer over a node, and over a scenario entry | 13b |
| Focus | Keyboard-focus a node, a scenario entry, the close control | 13a, 13b |
| Disabled | Simulate engine init failure | 13b |

Use OS-level reduced motion, not a faked media query. A faked query tests the CSS but not the JS branches that read `matchMedia`.

---

## 7. Viewport sizes

**Desktop** — 1920×1080, 1440×900, 1280×800, 1024×768

**Mobile and tablet** — 900×1200, 768×1024, 640×960, 390×844, 320×640

**Orientation and height edge cases** — 844×390 (landscape phone), 1024×480 (short desktop)

The overflow check runs at every width above. The fold measurement runs at 1440×900 and 1024×768 only, at DPR 1, `scrollY === 0`, after `await document.fonts.ready`.

---

## 8. Accessibility checks

- axe or Lighthouse accessibility at 390px and 1440px. Score 100 at both. Report the numbers, not "passed".
- Full page traversal by Tab alone from the top: every scenario entry, every link and the node layer reachable, each with a visible focus indicator, no trap, no unreachable control.
- Node layer: exactly one `[data-node-id][tabindex="0"]`; Tab into the SVG then Tab again leaves it; ArrowRight ×20 from the first node focuses each of the 21 exactly once.
- Escape from detail returns `document.activeElement` to the invoking node.
- `MutationObserver` on `#scenario-arrival` during `discord-task`: exactly two mutations across 17 arrivals.
- Contrast measured explicitly, not inferred from a passing audit: `--ink-muted` at `--text-xs`; context-zone label against `--zone-context-fill` (13c); dimmed node label against the substrate (13c).
- Reduced motion: no running `offset-distance` animation, edges highlight in hop order, caption and path readout update, dimming and readout marking have `0s` transitions, idle tour does not start.

---

## 9. Data validation checks

Each is a negative test. Make the edit, confirm the failure names the right identifier, revert, confirm `git status` is clean.

- Break an edge `to` reference → `npm run validate` exits non-zero naming that edge id
- Set `reverse: true` on `n8n-resend` → exits non-zero naming the hop and edge
- Set `"emphasis": "secondary"` on a zone (13c) → both `npm run validate` and page load fail, naming that zone id and the value
- Add a fourth zone with no wide-layout entry (13c) → exits non-zero, names the zone, states a layout entry is missing
- Empty one scenario's `hops` array (13c) → entry reads `0 hops`, no runtime figure, the string `Infinity` appears nowhere in the rendered document, activation neither plays nor throws

---

## 10. Build checks

- `npx tsc --noEmit` clean
- `npm run validate` exits zero on unmodified data
- `npm run build` succeeds, and `prebuild` runs validate as part of it
- Serve `dist/` from a subdirectory and confirm every asset resolves under the base path — a blank page with 404s means `base` was disturbed
- Load the built site (not the dev server), play all five scenarios, select and dismiss three nodes, resize across all nine widths: zero `console.error`
- `git diff --name-only main..HEAD` matches sections 3 and 4 exactly

---

## 11. What constitutes a failed implementation

Any one of these fails the change regardless of how good the result looks.

**Automatic failure**
- `src/packet.ts` appears in the diff
- A file from section 4 appears in the diff
- A new dependency in `package.json`
- `vite.config.ts` `base` changed, or the built site does not resolve from a subdirectory
- `grep -rn 'Math.random' src/` returns a hit
- A raw hex colour outside the `:root` block
- A temporary test edit left in the tree

**Behavioural failure**
- More than two live-region mutations for `discord-task`
- More or fewer than one `[data-node-id][tabindex="0"]` at any point
- More than 21 elements carrying `data-node-id`
- Any `circle.packet` that is not a direct child of the `svg` element
- `document.querySelectorAll('path.edge').length` not equal to 21 after edge wrapping
- Fold measurement above 340px at 1440×900 or 300px at 1024×768
- Stacked `viewBox` height above 1200 at 390px
- `scrollWidth !== clientWidth` at any tested width
- Lighthouse accessibility below 100 at either breakpoint
- A scenario playing differently on a second run
- The idle tour continuing after a user interaction

**Process failure**
- A product requirement invented rather than reported as an ambiguity
- An implementation decision taken from section 12 without reporting which
- A design choice changed because the implementer preferred a different result
- Proceeding past a red check
- Reporting a test result without having run it

If you cannot satisfy a requirement without violating one of these, stop and report the conflict. A blocked change with a clear report is a better outcome than a change that quietly relaxed a constraint.

---

## 12. Implementation decisions

The spec deliberately leaves these open. Take the recommended default unless you have a concrete reason not to, and report which you took.

| # | Decision | Recommended default | Change |
|---|---|---|---|
| D1 | Wording of the two scenario announcements | `"{name} scenario started"` and `"{name} scenario complete"` | 13a |
| D2 | Which node holds the initial `tabindex="0"` | The first node in document order | 13a |
| D3 | Whether arrow-key traversal wraps at the ends | No wrap; stop at first and last. Home and End cover the jump | 13a |
| D4 | Whether ArrowUp/Down also traverse, or only Left/Right | All four traverse in document order — the diagram is 2D and users will try both | 13a |
| D5 | How the loading skeleton is delivered | Static markup inside `#app` in `index.html`, replaced when the dynamic import resolves | 13b |
| D6 | Error-message wording | `"Could not load the topology: {id}."` plus a link reading `View the source on GitHub` | 13b |
| D7 | Whether the flow key is removed from the DOM or hidden when detail opens | Hidden via the `hidden` attribute, kept in the DOM. It contains no focusable elements, so nothing is lost | 13b |
| D8 | Shell padding used in the two-column width arithmetic | Keep the current value. Recompute the spec's arithmetic against whatever it actually is and record the numbers | 13b |
| D9 | Bottom-sheet dismissal affordance at ≤390px | The existing close control plus Escape. No swipe gesture | 13b |
| D10 | Reverse-hop indicator in the path readout | A `←` glyph in its own cell with a visually-hidden `reverse` label. Never swap the from/to labels | 13c |
| D11 | Which scenario the path readout shows before any activation | The first scenario in `scenarios.json` order | 13c |
| D12 | Whether the readout persists after a scenario completes | Yes, unmarked. Clearing it would make the panel flicker empty between tour scenarios | 13c |

If you hit a choice not on this list, that is an ambiguity in the spec. Report it; do not resolve it.

---

## 13. What to report on completion

Per change, in the merge commit or the archive note. Report only what you actually ran.

**Checks** — for each command in sections 5, 8, 9 and 10: the command, and its actual output or exit code. Not "passed".

**Measurements** — the real numbers:
- Fold `top` at 1440×900 and 1024×768, against the recorded baseline
- Stacked `viewBox` height at 390px, and the minimum adjacent label clearance
- Lighthouse accessibility at 390px and 1440px, before and after
- Live-region mutation count for `discord-task`
- `path.edge` and `[data-node-id]` element counts after wrapping (13c)
- The two-column width arithmetic as computed against the padding you used (13b)

**Decisions** — which default you took for every applicable row in section 12, and the reason for any you did not take.

**Deviations** — anything you did differently from the spec, with the requirement it touches and why. If there are none, say so explicitly.

**Ambiguities** — anything the spec did not determine, what you did about it, and whether you are blocked on it.

**Files** — `git diff --name-only main..HEAD`, verbatim.

**Visual** — screenshots at the section 7 viewports in the section 6 states, diffed against baselines, with a one-line description of each intended change. Visual diffs are review material for the design author, not a pass/fail gate — do not suppress a diff to make a check green.

**Not to report** — a test you did not run, an estimate presented as a measurement, or a claim that the design has been verified. Verification of design intent is the design author's, on the preview.
