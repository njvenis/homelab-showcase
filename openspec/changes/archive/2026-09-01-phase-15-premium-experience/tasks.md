## 1. Prerequisite and baseline

- [x] 1.1 Confirm the archived phase-10 baseline, record 1440×900/1024×768/768×900/390×844 screenshots, and confirm `npm run validate` and `npm run build` pass before applying phase 15.
- [x] 1.2 Capture baseline axe/Lighthouse results, reduced-motion behavior, scenario announcement counts, and document overflow at the four target widths.

## 2. Hierarchy and topology legibility

- [x] 2.1 Tune existing typography/spacing consumers so hero > section heading > body hierarchy is visible while the SVG fold targets remain ≤340px at 1440×900 and ≤300px at 1024×768. Verify with a fonts-ready browser measurement.
- [x] 2.2 Add deterministic per-`FlowKind` secondary edge cues and derived hover/selected-context text without changing edge truth, markers, or bidirectionality. Do not add keyboard focus stops for edges; preserve the roving node model. Verify all six kinds in colour and grayscale.
- [x] 2.3 Refine computed node clearance and stacked/channel routing without adding geometry to JSON. Verify every node label is clear at 390px and edge semantic count matches topology data.

## 3. Playback and state

- [x] 3.1 Replace the indefinite automatic loop with one data-order invitation pass and explicit replay ownership. Verify 2500ms delay, no second pass without replay, interaction disarm, and reduced-motion suppression.
- [x] 3.2 Add native Stop playback behavior through the existing engine cleanup path. Verify packets, glow, pulses, progress, timers, and duplicate rail/Flows state reset together.
- [x] 3.3 Add derived step text and keep progress/caption/start-completion announcements bounded. Verify `discord-task` produces no per-hop live-region announcements and all five scenarios remain keyboard-operable.

## 4. Inspector and responsive composition

- [x] 4.1 Preserve the topology while opening detail; keep non-modal region semantics and invoking-node focus return. Verify desktop/tablet non-occlusion and selected-node emphasis.
- [x] 4.2 Replace the current CSS `max-height: 18vh` phone cap with a readable ≤60vh scrollable sheet or equivalent document-order detail. Verify Close/Escape, long detail content, 390px, and short viewport behavior.
- [x] 4.3 Make scenario choices discoverable at 768px and 390px without unexplained horizontal overflow. Verify touch/focus targets, scroll affordance if a rail remains, and zero document overflow at all required widths.

## 5. Quality and documentation

- [x] 5.1 Exercise loading, empty, error, hover, focus, selected, running, stopped, disabled, and reduced-motion states with no console errors.
- [x] 5.2 Update `README.md` and `docs/v2-lit.md` only where the bounded playback and refined visual contract supersede current wording; preserve the synthetic/non-telemetry statement.
- [x] 5.3 Run `npm run validate`, `npm run build`, axe at 390/768/1024/1440, Lighthouse accessibility at 390/1440, and browser screenshot review. Confirm no new dependency and no `Math.random()` in `src/`.

## 6. Runbook Step 6 premium-experience checkpoint

- [x] 6.1 Complete the runbook Step 6 checkpoint: confirm hero hierarchy and fold targets, six flow kinds remain semantically legible in grayscale, one automatic pass is stoppable and never loops silently, node detail never removes the topology, mobile controls are discoverable, reduced motion is fully usable, and all measurable acceptance criteria pass.
