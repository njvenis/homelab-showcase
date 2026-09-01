## Why

The site already has a strong point of view: a synthetic, inspectable control-plane topology rendered as a lit technical instrument rather than a generic dashboard. The live experience is coherent on desktop, but its most important moments are not yet controlled with enough intention. The hero is visually quieter than the section headings, the topology relies too heavily on hue and dense geometry, autoplay behaves like an uninterruptible screensaver, and node inspection competes with the diagram on narrow screens. The mobile scenario rail also hides important choices behind undiscoverable horizontal overflow.

This implements runbook Step 6's post-v2 refinement checkpoint after the already archived `phase-10-design-language` change. It supersedes that phase's indefinite, uncontrolled-tour assumption; it does not replace the lit visual language or introduce live telemetry.

## Problem statement

Visitors should understand, within one calm first viewport, that this is a deliberately wired self-hosted control plane; then they should be able to follow one synthetic flow, stop it, inspect a node, and understand why each connection exists. Today the page communicates those facts, but visual hierarchy and interaction state make the visitor do too much decoding. The improvement must increase comprehension without turning the topology into a decorative network graphic or changing the declared architecture.

## Goals

- Make the hero the first visual claim and the topology the first proof.
- Make all six flow kinds legible through hue, restrained line grammar, and text—not hue alone.
- Make scenario playback bounded, interruptible, and understandable at every step.
- Keep node selection non-destructive: the topology remains visible while detail is read.
- Make the 1440px, 1024px, 768px, and 390px compositions intentional rather than merely shrinking.
- Preserve the existing zero-dependency, direct-SVG, JSON-driven architecture and deterministic animation paths.
- Preserve keyboard access, focus return, reduced-motion support, error handling, and the synthetic/non-telemetry editorial contract.
- Restore repository-facing count copy to the validated graph: the current JSON contains 22 nodes and 22 edges, while `README.md` still states 21 and 21.

## Non-goals

- No live telemetry, backend, analytics, health status, uptime claim, or API integration.
- No new framework, graph-layout dependency, animation library, font, or icon package.
- No new topology edges, inferred connections, fake aggregation, or geometry stored in JSON.
- No card-heavy dashboard treatment, neon cyberpunk effects, decorative gradients, or section entrance choreography.
- No change to the meaning of a node, edge, zone, reverse hop, transitional node, or one-model-resident constraint.
- No source-code implementation in this proposal change; the change contains OpenSpec artefacts only.

## Design principles

1. **The topology is the evidence.** Prose frames it; it does not compete with it.
2. **Hue means flow kind, always.** Hue is retained, but never remains the sole way to decode a connection.
3. **Motion has a job.** Packets explain a declared hop; playback controls explain the script; no motion exists only to make the page feel busy.
4. **Depth comes from light and spacing.** Use the existing lit palette and `surface-2`; avoid a generic shadow/card kit.
5. **Reveal without falsifying.** Short labels may be used for fit, but full technical labels and details remain available on selection and in accessible text.
6. **Quiet defaults, explicit control.** The page may invite a first flow, but visitors can stop it and retain a stable reading state.
7. **Progressive density.** Desktop exposes relationships; mobile exposes sequence and meaning before detail.

## Proposed visual direction

Call the direction **Instrumented topology**: a dark, editorial technical atlas with a permanently semantic network, a measured status line, and one deliberate active flow. The current Fraunces / IBM Plex Sans / IBM Plex Mono pairing remains. The lit network remains the signature, but idle edges become a little more discriminable through a restrained kind-specific dash grammar. The effect should read as an instrument with signal paths, not as a game board.

Idle edges use the existing derived `--edge-idle-*` colours. Their non-colour grammar is deterministic: control solid, inference long dash, memory dot, health dash-dot, egress short dash, and network long dash-dot. The grammar is a secondary cue and must not imply direction, priority, or live status. Direction remains encoded only by the existing declared edge semantics and packet direction. Hovered edges and selected node/path contexts expose a compact text label derived from their endpoint node labels and kind; no new edge truth is authored and edges do not become additional keyboard focus stops.

The hero retains its existing measured scale and authority, but remains short enough to keep the diagram near the first fold. The scenario controls become a compact playback instrument with one explicit stop/replay action, a step count derived from the hop array, and a caption that explains the selected script. Editorial Flows and Decisions remain prose rows, not cards.

## Design tokens

All colour remains in the existing `:root` token layer. Existing full-bright flow hues are unchanged.

| Family | Token / value | Use |
|---|---|---|
| Colour | `--substrate: #121A22` | page and node substrate |
| Colour | `--surface: #1B2530` | zones and controls |
| Colour | `--surface-2: #24303E` | selected/hovered/raised playback and detail surfaces |
| Colour | `--rule: #34424F` | structural rules and fallback stroke only |
| Colour | `--ink: #E4EAF0` | primary text and labels |
| Colour | `--ink-muted: #93A5B5` | secondary text; must remain readable on every surface |
| Colour | existing `--flow-control`, `--flow-memory`, `--flow-infer`, `--flow-health`, `--flow-egress`, `--flow-network` | semantic flow hues; no replacements |
| Colour | existing `--edge-idle-*`, `--bloom-*` | derived idle and stage-light presentation |
| Type | Fraunces, weight 480–540 | hero, section headings, scenario/node titles |
| Type | IBM Plex Sans, `--text-base: 1.0625rem` | body and interface copy |
| Type | IBM Plex Mono, `--text-xs` / `--text-sm` | machine values, path readout, step/status metadata; lowercase where it is a value |
| Type | `--text-hero: clamp(3.5rem, 8vw, 5.5rem)` | preserve the existing authoritative hero scale; tune only against the fold measurements |
| Type | `--text-2xl: 3rem` | existing section-heading scale; must remain visually subordinate to the hero |
| Space | existing 4px-based `--space-*` scale | all layout rhythm; no one-off spacing values |
| Space | `--measure-stage: 92rem`, `--measure-wide: 75rem`, `--measure-prose: 34rem` | stage, editorial, and reading measures |
| Border | `--border-hair: 1px`, `--border-emphasis: 1.5px`, selected/focus stroke `3px` | calm resting structure and clear interaction |
| Border | `--radius-sm: 4px`, `--radius-md: 8px` | controls and detail surface; no pill treatment except status text where semantically needed |
| Motion | `--motion-fast: 120ms`, `--motion-base: 220ms`, `--motion-slow: 400ms` | hover, state, and detail transitions |
| Motion | existing `--ease-standard` and `--ease-out` | all UI transitions; packet travel remains data-timed |
| Motion | initial invitation `2500ms`; inter-scenario rest `3000ms` | one bounded idle-tour pass only |

Under `prefers-reduced-motion: reduce`, packet travel is not shown, topology and detail do not translate, progress updates per completed hop, and arrival feedback is a fixed-colour state followed by a fade. A reduced-motion visitor never receives the automatic tour.

## Page-level composition changes

- Keep the existing static header, `#app`, Decisions section, and footer landmarks.
- Give the hero a clear three-level sequence: headline, one-sentence standfirst, then the lowercase machine readout. The readout remains a status line, not a stat-card grid.
- Keep the topology as the largest object on the page and ensure its top edge remains at or above the existing fold targets: ≤340px at 1440×900 and ≤300px at 1024×768.
- At desktop, use the existing stage/control two-column composition. The control column contains scenario playback, path readout, flow key, and selected-node detail without hiding the topology.
- Add a compact playback status/stop action adjacent to the scenario controls. It must be visible while any script is running and must reset to a quiet idle state when stopped.
- Retain five full-width Flows rows and three Decisions prose blocks. Strengthen their ordering with spacing and heading scale, not cards, rules, or section animations.
- Keep the footer to the existing source link and “Built with the stack it describes.” line.

## Topology and zone hierarchy changes

- Preserve the three zones and their current semantic tier: Raspberry Pi 5 and Workstation (WSL2) are primary; Outside the house is contextual and visibly distinct.
- Improve zone headers with consistent label/sub-label alignment and enough breathing room to prevent node labels from competing with zone names.
- Keep documentation counts and any visible derived count consistent with the validated topology; do not hand-maintain a second graph count in the renderer.
- Keep all node labels in the SVG short enough for the current node rectangle where possible. Full labels, model names, transitional state, zone, kind, and detail remain in the inspector and accessible name.
- Add deterministic non-colour edge line styles by `FlowKind`, while retaining existing kind hue, glow, markers, bidirectionality, and transitional node dashes. Never use line style to imply direction.
- Add a derived endpoint/kind text cue on edge hover and selected node/path context. Do not make edges additional keyboard focus stops; preserve the existing one-tab-stop roving node model. Decorative glow paths remain `aria-hidden` and pointer-transparent.
- Replace heuristic collision risk with a layout-level clearance check and deterministic routing refinement in `src/layout.ts`. Geometry remains computed from the current topology and viewport; no coordinates or route lanes are added to JSON.
- At stacked widths, use vertical zone growth and explicit clearance rather than truncating technical labels or collapsing distinct edges into one visual line. If the fixed-height budget cannot satisfy clearance, verification must fail rather than silently reduce legibility.

## Scenario playback and interaction changes

- Replace the current indefinite idle loop with one automatic invitation pass after 2500ms, then hold in a stable completed/idle state. The user may explicitly replay; there is no background loop.
- Add a visible `Stop playback` action while any scenario is running. Stopping cancels active packets through the existing engine, clears progress, and leaves the topology stable. Manual scenario buttons remain available.
- Keep the single scenario engine as the source of truth. Rail buttons and Flows-row buttons must share running state, caption, progress, and stop semantics.
- Show `step N of M` or equivalent text derived from `completedHops` and `totalHops`; do not add authored timing metadata. The existing path readout marks the current hop and identifies reverse travel in text.
- Keep the 2px progress bar, but pair it with text state so progress is not motion-only. Under reduced motion it steps at hop completion.
- Keep arrival pulses driven by packet completion. A concurrent arrival at one node restarts that node's pulse; it never creates a stack of competing animations.
- Announce scenario start and completion once each through the existing bounded live region. Do not announce individual packets or the automatic pass continuously.
- User interaction disarms the automatic invitation for the session, as today; explicit replay is a deliberate user action, not an accidental background restart.

## Selected-node detail behaviour

- Keep the inspector as a non-modal `aside`/region with an accessible heading. It must never replace or cover the topology at widths ≥768px.
- Opening detail keeps focus on the invoking node. Escape and Close return focus to that node, preserving the existing roving-tabindex model.
- Keep the selected node, adjacent nodes, and incident edges at full emphasis; dimming is a reading aid only and must not stop, pause, or rewrite playback.
- Keep the flow key available when space permits; if it is temporarily moved below the detail region, it must not destroy focus or remove the only explanation of flow meaning.
- At 768px and below, detail follows the stage in document order so it does not cause an unexpected viewport jump. At 390px it may become a bottom sheet capped at 60% of the viewport, with Close at the top, internal scrolling, and the stage still visibly present above it.
- Long model labels and detail copy wrap; no fixed 18vh cap is permitted for the phone inspector.

## Responsive behaviour

| Viewport | Composition and interaction |
|---|---|
| 1440px | Stage dominates a centred max-width shell; two columns with a fixed 18rem control rail. Hero uses the full measured display scale. Topology labels and edge paths have comfortable clearance. |
| 1024px | Retain two columns if the stage track is at least 36rem; otherwise use the defined single-column fallback. Keep the stage within the first fold and prevent the control rail from forcing horizontal overflow. |
| 768px | Single column. Scenario controls use a visible wrapping grid or fully discoverable rail with an explicit overflow cue; stage follows immediately; legend/detail remain in document order. Touch/focus targets retain at least 24px hit area and a visible 3px focus indicator. |
| 390px | Single column with stacked topology zones sized by data-derived height. Scenario controls wrap into readable rows rather than requiring an unexplained 2× horizontal carousel. Readout wraps cleanly. Inspector is a scrollable bottom sheet up to 60vh, Close remains reachable, and no text or path is clipped. |

All four widths, plus 320px, 640px, 900px, 1280px, and 1920px, must have zero document-level horizontal overflow. Short viewports (≤480px high) retain the existing compressed masthead rules, but may not hide the standfirst or readout.

## Required states

- **Loading:** retain a stable stage skeleton with `role="status"` and `aria-busy="true"`; reserve enough height to avoid a jump before data arrives; do not start the tour.
- **Empty:** retain the topology and show a concise, non-alarming “No scenarios are defined” message; hide playback-only controls and do not create a fake active state.
- **Error:** retain the accessible `role="alert"` error surface and source link; identify the failing data id when available; no partial misleading playback controls.
- **Hover:** raise border/edge emphasis and expose the edge/node text cue without transform, scale, or excessive glow.
- **Focus:** use a persistent high-contrast 3px ring/stroke; focus must be visible on SVG nodes, scenario controls, stop/replay, links, and Close.
- **Selected/running:** use `surface-2`, kind hue, accent bars, path-row state, and text status consistently across duplicate controls; never rely on colour or motion alone.
- **Disabled/unavailable:** native-disable playback controls when the scenario engine cannot initialise, with an adjacent explanation; disabled controls must not look like a running or completed state.
- **Reduced motion:** no automatic tour, no travelling packet, no transform transitions, no continuous progress animation; retain usable controls, discrete progress, text captions, focus, and colour-step arrivals.

## Accessibility requirements

- Preserve semantic landmarks and the existing one-tab-stop roving keyboard model for nodes.
- Preserve Enter/Space activation, Arrow/Home/End traversal, Escape dismissal, and focus return for node detail.
- Make the new stop/replay control a native button with an accessible name and state that describes the action, not its visual styling.
- Every node and every flow control has a text name. Every flow kind has a written legend meaning. Edge hover/selected-context cues provide endpoint/kind text so colour is supplementary; edges do not become additional keyboard focus stops.
- Decorative glow paths and packets remain hidden from assistive technology and do not create extra focus stops.
- Scenario start/completion announcements remain bounded; step/progress status is not emitted once per animation frame to a live region.
- Meet WCAG 2.2 AA for text, focus, target size, non-text contrast, keyboard operation, and reduced motion. Verify Lighthouse accessibility remains 100 at 390px and 1440px, and run axe at all four target widths.

## Exact source files likely to require changes

| File | Likely responsibility |
|---|---|
| `index.html` | hero/title metadata or static loading semantics only if the audit proves they need correction; retain landmarks and no new app shell |
| `src/main.ts` | playback status/stop action, edge text cues, inspector presentation, focus/dimming reconciliation, responsive render hooks, bounded tour invitation |
| `src/style.css` | hero/section hierarchy, token consumers, edge dash grammar, playback states, inspector mobile sheet, overflow/focus/reduced-motion states |
| `src/layout.ts` | deterministic node-clearance assertion and improved stacked/channel routing; geometry remains computed, not authored |
| `src/scenario.ts` | explicit automatic-pass ownership and stop/replay boundary if current tour state cannot express it without ambiguity |
| `src/packet.ts` | only if packet completion/cleanup needs a small integration adjustment; do not duplicate scheduling or weaken reference counting |
| `src/data/load.ts` | only to strengthen validation of existing ids/content relationships; no new runtime source |
| `src/data/readout.json` | only if the authored model/throughput wording is corrected after checking it against the current roster; do not invent a metric |
| `README.md`, `docs/v2-lit.md` | update the source-of-truth wording for bounded playback and the refined visual contract |

`src/types.ts`, `src/data/topology.json`, `src/data/scenarios.json`, and `src/data/flow-content.json` require no schema change for this direction. Content edits are optional and must remain factual; all geometry and playback timing continue to come from existing data.

## Data-model constraints

- `topology.json` remains the sole graph truth: existing zones, nodes, edges, `FlowKind`, `bidirectional`, and `transitional` semantics are preserved.
- `scenarios.json` remains the sole script truth: ordered hops, `at`, `duration`, and `reverse` remain authoritative. The UI derives total duration, step counts, labels, and progress; no duplicate authored state is introduced.
- `flow-content.json` remains keyed by scenario id. Loader validation must continue to reject missing scenario/content relationships rather than rendering an empty premium-looking row.
- Positions, label widths, dash patterns, lanes, collision checks, and focus sets are presentation calculations, not new JSON fields.
- No random values, time-derived meaning, or live network status may enter rendered content. `Math.random()` remains absent from animation paths.
- Existing one-way edge restrictions remain enforced. A visual line pattern must never be used as a substitute for declared direction.

## Implementation sequencing for the local coding agent

1. Confirm the archived `phase-10-design-language` baseline and capture 1440px/1024px/768px/390px and reduced-motion baselines before applying this proposal.
2. Apply token and hierarchy adjustments only; verify fold position, contrast, type scale, and zero overflow before touching playback.
3. Improve deterministic layout clearance and edge/path presentation; verify node-label bounds, one semantic edge per declared edge, and no false direction cues.
4. Add the playback status/stop action and bounded one-pass invitation using the existing scenario engine. Verify manual playback, automatic playback, cancellation, completion, and duplicate rail/Flows state.
5. Reconcile selected-node detail across desktop, tablet, and phone; verify focus return, scrolling, no topology occlusion, and no 18vh clipping.
6. Exercise loading, empty, error, hover, focus, disabled, selected, running, and reduced-motion states with deterministic fixtures or narrowly scoped test hooks; do not add a test-only runtime dependency.
7. Update `README.md`/`docs/v2-lit.md` if behavior changed, then run `npm run validate`, `npm run build`, browser checks, axe, Lighthouse, and the final runbook checkpoint.

## Test and verification requirements

- `npm run validate` passes with current JSON and rejects missing ids, invalid reverse hops, and invalid scenario timing.
- `npm run build` passes with no new dependency and no `Math.random()` in `src/`.
- Browser measurements at exactly 1440×900, 1024×768, 768×900, and 390×844 after `document.fonts.ready` confirm fold targets, no document overflow, and visible stage/detail relationships.
- Inspect every rendered node at 390px and assert its SVG text bounding box remains within its node/zone clearance policy; inspect all edge paths for distinct declared IDs and no accidental semantic duplicates.
- Exercise all five scenarios from both the rail and Flows rows. Confirm one active scenario, correct reverse text, progress reset on stop, bounded start/completion announcements, and no automatic loop after the invitation pass.
- Verify Stop playback cancels packets and reference-counted edge activity without stale glow, stale pulse, or stuck progress.
- Verify node selection and dismissal by pointer and keyboard, including selected `swap`, transitional `cowork`, and a long-detail node; confirm focus remains/returns as specified.
- Run axe-core at 390px, 768px, 1024px, and 1440px; run Lighthouse accessibility at minimum at 390px and 1440px and retain a score of 100.
- Run the same interaction checks with `prefers-reduced-motion: reduce`: no tour/travel/continuous progress, but readable captions, step updates, focus, and discrete arrivals remain.
- Capture screenshots at all four target widths for human review of hierarchy, topology clearance, line grammar, playback affordance, and mobile discoverability.

## Measurable acceptance criteria

1. At 1440×900 the hero headline is larger than any section heading, and the topology SVG top is ≤340px; at 1024×768 the SVG top is ≤300px.
2. At 1440px, 1024px, 768px, and 390px the topology remains visible when detail is open; at widths ≥768px the inspector and SVG bounding rectangles do not intersect.
3. At widths 320, 390, 640, 768, 900, 1024, 1280, 1440, and 1920, `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
4. Each declared edge has exactly one semantic path plus only non-semantic glow presentation, and each of the six `FlowKind` values has both its existing hue and a documented non-colour/text cue.
5. A visitor can stop any running scenario with one native button action; after stopping, no packet, progress bar, arrival pulse, or tour timer remains active.
6. The automatic invitation starts no earlier than 2500ms, plays each scenario in data order at most once, and never loops without an explicit replay action; reduced motion starts no invitation.
7. Rail and Flows controls for the same scenario expose identical running/stopped state, accessible name, caption, and progress, with no duplicate live-region announcement per hop.
8. At 390px the selected-node detail is fully reachable by scrolling within a sheet no taller than 60vh; Close is reachable without requiring horizontal scrolling or losing the invoking node context.
9. `npm run validate`, `npm run build`, axe at all target widths, and Lighthouse accessibility at 390px/1440px pass; no console errors occur during the five scenario runs.
10. Reduced-motion verification shows no travelling packets, automatic tour, transform-based detail motion, or continuous progress animation, while all content and controls remain usable.

## Explicit risks and rollback considerations

- **Phase boundary:** phase 10 is already archived and remains the baseline for the lit token/tour surface. Mitigation: verify that baseline before applying this successor and do not retain both tour-loop rules simultaneously.
- **Hierarchy regression:** hero sizing can push the stage below the fold. Mitigation: use the stated fold measurements as a gate and tune the existing token rather than adding a second hero system.
- **Line-grammar noise:** six dash patterns may make the map busier or appear directional. Mitigation: keep opacity/substrate restrained, test grayscale and colour-vision simulations, and retain hover/selected-context text cues without changing edge truth.
- **Layout changes:** routing improvements can alter screenshots and packet paths. Mitigation: preserve stable edge ids, refresh live packet paths after resize, and reject only true clearance failures; revert layout changes independently if needed.
- **Playback state complexity:** bounded automatic playback can race manual play or reduced-motion changes. Mitigation: keep one owner for tour state, cancel tour-owned work on interaction, and use the existing engine stop/cleanup path.
- **Mobile detail occlusion:** a bottom sheet can cover the stage or trap focus. Mitigation: cap at 60vh, keep Close first, preserve Escape/focus return, and test short viewports explicitly.
- **Content drift:** readout, scenario captions, and long flow copy can diverge. Mitigation: keep schema unchanged, validate ids, and make any editorial correction in the data source rather than in render strings.
- **Rollback:** revert the phase-15 commit and restore the verified phase-10 lit baseline. Topology/scenario JSON and the existing packet/scenario engine remain the fallback source of truth.

## Capabilities

### New Capabilities

- `premium-experience`: Makes the existing lit topology, playback, inspection, and responsive composition feel intentional, controllable, and technically legible without changing graph truth.

### Modified Capabilities

- `design-language`: refines hierarchy and adds a secondary non-colour edge cue while preserving the six hue tokens.
- `interaction`: adds explicit playback stop/replay affordance and preserves bounded announcements/focus behavior.
- `stage-composition`: refines responsive detail placement and mobile clearance rules.
- `scenario-engine`: changes the automatic invitation from an indefinite loop to one bounded pass with explicit replay.

## Impact

The likely implementation touches `src/main.ts`, `src/style.css`, `src/layout.ts`, and `src/scenario.ts`, with conditional changes to `src/packet.ts`, `src/data/load.ts`, `index.html`, `src/data/readout.json`, `README.md`, and `docs/v2-lit.md` as listed above. It adds no dependency, backend, framework, or new data-model field. A reviewer should be able to see a stronger hero, an always-readable lit topology, controllable one-pass playback, stable node detail, and discoverable mobile controls at the four target widths.

## Source of Truth

This proposal is the approved-direction contract for phase 15. Existing graph and script truth remains in `src/data/topology.json` and `src/data/scenarios.json`; existing lit palette and motion foundations remain in `docs/v2-lit.md` and the archived phase-10 design-language change, while phase 15 supersedes phase 10's indefinite tour-loop rule. Requirements are formalized in `specs/premium-experience/spec.md`.
