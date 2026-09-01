## 0. Baseline

- [x] 0.1 Build current `main` and capture screenshots at 390, 768, 1024 and 1440 in idle state into `tests/visual/baseline/`. Commit. Verify four non-empty files.
- [x] 0.2 Record the current Lighthouse accessibility score at 390px and 1440px. Note both numbers in the commit message.

## 1. Live region

- [x] 1.1 In the `subscribe` handler of `src/main.ts` (~700–715), remove the per-arrival `arrivalLive.textContent` assignment. Leave `emitArrivalPulse(arrival)` in place.
- [x] 1.2 Write one announcement on scenario start naming the scenario, and one on completion. Verify with a `MutationObserver` on `#scenario-arrival` that `discord-task` produces exactly two mutations across its 17 arrivals.
- [x] 1.3 Verify neither announcement contains a node label from an individual hop.
- [x] 1.4 Run the idle tour for three full cycles and confirm mutations equal exactly two per scenario played.
- [x] 1.5 Play a scenario with reduced motion off and confirm arrival pulses still fire visually.

## 2. Hero readout

- [x] 2.1 Remove `role="status"` and `aria-live="polite"` from `#hero-readout` in `index.html`.
- [x] 2.2 Verify both attributes are absent and the rendered text still contains the briefing time, resident-model count and throughput.

## 3. Roving tabindex

- [x] 3.1 In the node markup in `renderTopology` (`src/main.ts` ~151), render `tabindex="0"` on the first node only and `tabindex="-1"` on the rest. Leave `role="button"`, `aria-label`, `data-node-id`, `data-node-kind` and `focusable` unchanged.
- [x] 3.2 Bind a `keydown` handler on the node layer — not on `document` — handling ArrowLeft/ArrowRight/ArrowUp/ArrowDown to move focus in document order, Home and End to jump to first and last, and Enter/Space to open detail. Moving focus must also move `tabindex="0"`.
- [x] 3.3 Verify Tab into the SVG then Tab again leaves the SVG entirely, and `document.querySelectorAll('[data-node-id][tabindex="0"]').length` is 1.
- [x] 3.4 Verify ArrowRight pressed 20 times from the first node focuses each of the 21 nodes exactly once, with a visible ring each time and exactly one `tabindex="0"` after every move.
- [x] 3.5 Verify End then Home moves to last then first.
- [x] 3.6 Verify arrow keys pressed while focus is on a scenario button or a page link do not move node focus.

## 4. Focus return

- [x] 4.1 In the inspector close path (`src/main.ts` ~346–352), ensure focus returns to the node that opened the detail. Do not change focus-on-open — the element is still `role="dialog" aria-modal="true"` in this change.
- [x] 4.2 Verify Escape from detail opened on `mnemosyne` sets `document.activeElement` to that node and that node carries `tabindex="0"`.
- [x] 4.3 Verify activating the close control by keyboard from detail opened on `swap` returns focus to the `swap` node.
- [x] 4.4 Verify Escape works from within the detail panel and from the node layer.

## 5. Verification

- [x] 5.1 `npx tsc --noEmit`, `npm run validate`, `npm run build` all pass.
- [x] 5.2 axe or Lighthouse accessibility at 390px and 1440px: score 100 at both, matching the 0.2 baseline. Report both numbers.
- [x] 5.3 Full page traversal by Tab alone: no trap, no unreachable control.
- [x] 5.4 Load the built site, play all five scenarios, open and dismiss three nodes: zero `console.error`.
- [x] 5.5 Screenshots at 390, 768, 1024 and 1440 in idle state, diffed against the 0.1 baselines: no pixel difference outside focus indicators. Any other difference is a defect in this change.
- [x] 5.6 Confirm the diff touches only `index.html` and `src/main.ts`.
