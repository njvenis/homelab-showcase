# stage-composition Specification

## Purpose
Reallocates the page around the topology: a compressed masthead, a two-column stage-and-control composition at desktop widths, node detail as a panel rather than an overlay, and defined responsive ranges and interaction states.

The page presents scripted, synthetic flows. No requirement here introduces live telemetry, metrics, uptime or health, and none may be implemented in a way that implies them.

**Depends on** `phase-13a-a11y-correctness` having shipped — the keyboard model and focus-return behaviour specified there are assumed.

**Architectural constraints binding on every requirement:**

- `src/packet.ts` is NOT modified. No rule may set `opacity`, `stroke`, `display`, `offset-path`, `offset-distance` or `--packet-flow` on `path.edge`, `path.edge-glow` or `circle.packet`.
- Nodes already render inside `<g class="node-control" data-node-id="…" role="button">` (`src/main.ts` ~151). No additional node wrapper is introduced by this change, and nothing else may carry `data-node-id`.
- `src/layout.ts` constants may be retuned for the stacked layout only. The wide layout's zone rectangles are unchanged.
- Control-column markup is built in `src/main.ts` string assembly, matching how the rail and legend are already constructed. `index.html` gains no new structural element.
- No new dependency, no framework, no change to the Vite `base` path or the Pages workflow.

**File and function map** (`src/main.ts` @ `157da44`): `renderScenarioRail` ~163; `renderLegend` ~182; shell assembly ~194–213; inspector markup ~201; `nodeControls` ~227–244; inspector open ~289–337; close ~346–352; `#hero-readout` write ~767. Layout constants: `src/layout.ts` ~30–36.

---

## Requirements

### Requirement: Design tokens with named consumers

The following SHALL be added to the existing `:root` block in `src/style.css`. No existing token value changes and no new colour hue is introduced.

| Token | Value | Consumer |
|---|---|---|
| `--measure-control` | `18rem` | width of `.control-column` at ≥1024px |
| `--measure-stage-min` | `36rem` | minimum stage column width; below it, single-column fallback |
| `--border-hair` | `1px` | node borders at rest, scenario entry borders |
| `--border-emphasis` | `1.5px` | node border on hover, focus rings |
| `--radius-sm` | `4px` | scenario entry |
| `--radius-md` | `8px` | detail panel, control-column groups |
| `--motion-fast` | `120ms` | hover border-weight, pressed background |
| `--motion-slow` | `400ms` | detail panel enter and exit |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | detail panel |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | hover, pressed |

Every token above SHALL have at least one consumer in the stylesheet after this change. A token with no consumer SHALL be removed rather than left defined.

#### Scenario: Tokens present with exact values

- **GIVEN** `src/style.css` after this change
- **THEN** each token above exists with the exact value specified
- **AND** the six `--flow-*`, six `--edge-idle-*` and six `--bloom-*` tokens are byte-identical to before the change
- **AND** the type, space and measure tokens from the composition capability are byte-identical to before the change

#### Scenario: Every token is consumed

- **GIVEN** the post-change stylesheet
- **WHEN** each token above is searched for outside `:root`
- **THEN** each appears in at least one declaration

---

### Requirement: The topology is visible above the fold at desktop widths

The topology SVG's top edge SHALL sit no more than 340px from the top of the document at 1440×900, and no more than 300px at 1024×768.

Changes in `src/style.css`: `.page-header h1` from `var(--text-hero)` to `var(--text-2xl)`; `.page-header` padding to `var(--space-12)` top and `var(--space-8)` bottom; standfirst `margin-top` to `var(--space-4)`; `#hero-readout` `margin-top` to `var(--space-3)`; `.topology-stage` `margin-top` from `var(--space-24)` to `var(--space-8)`.

The masthead retains title, standfirst and readout. None may be removed, hidden, or moved below the stage.

**Measurement procedure.** Any headless browser. Viewport exactly the stated size, device pixel ratio 1, `window.scrollY === 0`. Run:

```js
await document.fonts.ready
const r = document.querySelector('#app svg').getBoundingClientRect()
// assert r.top, and Math.min(r.bottom, innerHeight) - r.top
```

Without the `fonts.ready` await the measurement races the webfont swap and is not reproducible.

#### Scenario: Fold position at 1440×900

- **GIVEN** a 1440×900 headless viewport at DPR 1, fonts ready, `scrollY === 0`
- **WHEN** the snippet above is run
- **THEN** `r.top` is ≤ 340
- **AND** `Math.min(r.bottom, 900) - r.top` is ≥ 400

#### Scenario: Fold position at 1024×768

- **GIVEN** a 1024×768 headless viewport under the same conditions
- **THEN** `r.top` is ≤ 300

---

### Requirement: Two-column stage composition at 1024px and above

At widths ≥ 1024px, `.interaction-shell` SHALL be a grid with `grid-template-columns: minmax(var(--measure-stage-min), 1fr) var(--measure-control)` and `gap: var(--space-8)`. Column one holds `.topology-stage`; column two holds `.control-column`.

`.control-column` SHALL contain, in DOM order: the scenario list, then either the flow key or — while a node is selected — the node detail panel.

**Width arithmetic the implementation must preserve.** At 1024px with `var(--space-6)` shell padding each side and `var(--space-8)` gap: 1024 − 48 − 32 = 944 available; 944 − 288 = 656 ≥ 576. Two columns therefore hold at 1024px. If shell padding or gap is changed, recompute before accepting.

Above `--measure-stage` (92rem) the shell SHALL cap and centre; the control column stays at `--measure-control` and the stage absorbs the remainder.

Fallback: if the stage column would compute below `--measure-stage-min`, the layout SHALL fall back to single column with control content below the stage.

#### Scenario: Two columns at 1024px and 1440px

- **GIVEN** the page at 1024px, then 1440px
- **WHEN** `getComputedStyle(document.querySelector('.interaction-shell')).gridTemplateColumns` is read
- **THEN** it resolves to two track values at both widths
- **AND** the scenario list's bounding rect does not vertically precede `#app svg` at either width

#### Scenario: Single column below 1024px

- **GIVEN** the page at 900px and again at 769px
- **THEN** the shell renders as one column at both, scenario list above the stage, flow key below it

#### Scenario: No horizontal overflow at any width

- **GIVEN** widths 320, 390, 640, 768, 900, 1024, 1280, 1440, 1920
- **THEN** `document.documentElement.scrollWidth === document.documentElement.clientWidth` at every width

---

### Requirement: Node detail is a panel, not an overlay

Selecting a node SHALL populate a node-detail panel in `.control-column`. The panel SHALL NOT overlap, dim or obscure the topology SVG at any width ≥ 768px.

`.canvas-dimmer` SHALL be removed from `src/main.ts` and `src/style.css`. `role="dialog"`, `aria-modal="true"` and `aria-live="polite"` SHALL be removed from the detail element, which becomes `role="region"` with an accessible name taken from its heading.

**Focus on open.** Because the element is no longer modal, focus SHALL remain on the invoking node when detail opens. The panel SHALL NOT be auto-focused, and the close control SHALL NOT receive focus on open — the current `closeInspectorButton.focus()` call is removed. Focus return on dismissal is unchanged from `phase-13a`.

**Tab order.** The panel does not trap. Tab from the last control inside it continues to the next focusable element in DOM order.

**Flow-key swap safety.** The flow key SHALL contain no focusable elements, so swapping it for the panel cannot destroy focus. If a focusable element is ever added to the flow key, focus must be moved before the swap.

Content is unchanged: node label, zone label, kind label, transitional status where applicable, and the node's `detail` text.

#### Scenario: Selecting a node does not obscure the diagram

- **GIVEN** the page at 1440px
- **WHEN** a node is activated
- **THEN** the panel's bounding rect does not intersect the bounding rect of `#app svg`
- **AND** `document.querySelector('.canvas-dimmer')` is null
- **AND** no source file contains the string `canvas-dimmer`

#### Scenario: Focus stays on the node when detail opens

- **GIVEN** focus on node `swap`
- **WHEN** Enter is pressed to open detail
- **THEN** `document.activeElement` is still the `swap` node
- **AND** the panel is visible and populated

#### Scenario: Dialog semantics removed

- **GIVEN** the detail panel in the DOM
- **THEN** it has none of `role="dialog"`, `aria-modal`, `aria-live`
- **AND** it is a `region` with a non-empty accessible name

#### Scenario: Panel does not trap focus

- **GIVEN** the detail panel open at 1440px with focus on its close control
- **WHEN** Tab is pressed
- **THEN** focus moves to the next focusable element in DOM order outside the panel

#### Scenario: Flow key replace and restore at desktop

- **GIVEN** the flow key visible with no node selected at 1440px
- **WHEN** a node is activated then dismissed
- **THEN** the flow key is hidden while detail is shown and visible again afterwards
- **AND** the flow key contains no element matching `a, button, input, select, textarea, [tabindex]`

---

### Requirement: Responsive behaviour by range

**≥ 1440px** — two-column; shell caps at `var(--measure-stage)` and centres; control column fixed; stage absorbs remaining width. Flows and Decisions retain the composition capability's editorial treatment unchanged.

**1024–1439px** — two-column, subject to the fallback.

**769–1023px** — single column. Scenario list above the stage as a horizontally scrolling rail with `scroll-snap-type: x proximity` and `overscroll-behavior-inline: contain`. Flow key below the stage. Node detail renders inline below the stage.

`proximity` rather than `mandatory`: mandatory snapping can prevent a keyboard-focused entry from being scrolled fully into view even with `scroll-margin`.

**391–768px** — as above, plus masthead padding reduced to `var(--space-8)`.

**≤ 390px** — as above, plus: masthead padding `var(--space-6)`; node detail becomes a bottom sheet with `overscroll-behavior: contain`, height ≤ 60% of viewport height, top edge below the vertical midpoint of the SVG's visible area; the stacked topology fits within 1200px of SVG height.

**Stacked-layout constants** in `src/layout.ts`: `STACK_HEADER` 56 → 40, `STACK_ZONE_GAP` 28 → 20. `STACK_TOP` unchanged at 24. `NODE_HEIGHT` unchanged at 36.

`STACK_ROW_PITCH` SHALL NOT be a fixed constant. It SHALL be computed from the live data so that adding a node cannot silently breach the height bound:

```ts
const STACK_PITCH_FLOOR = 40   // NODE_HEIGHT 36 + 4px minimum gutter
const STACK_PITCH_CEIL  = 64   // the pre-change value; never exceed it
const STACK_BUDGET      = 1200

function stackRowPitch(nodeCount: number, zoneCount: number): number {
  const chrome = zoneCount * STACK_HEADER
              + (zoneCount - 1) * STACK_ZONE_GAP
              + 2 * STACK_TOP
              + zoneCount * 20          // per-zone bottom padding
  const budget = Math.floor((STACK_BUDGET - chrome) / nodeCount)
  return Math.max(STACK_PITCH_FLOOR, Math.min(STACK_PITCH_CEIL, budget))
}
```

At the current data (22 nodes, 3 zones) this yields pitch 42 and a total of 1192px. At 21 it yields 44; at 23 it yields 40. Beyond 23 nodes the floor is reached and the bound is legitimately breached — the acceptance criterion must fail rather than the floor being lowered.

**Short viewports** — at `(max-height: 480px)` the masthead SHALL be reduced further:

| Element | Short-viewport value |
|---|---|
| `.page-header` padding | `var(--space-4)` top and bottom |
| `h1` | `var(--text-xl)`, `max-width: none`, one line |
| standfirst | `var(--text-base)`, `margin-top: var(--space-4)` |
| `#hero-readout` | `var(--text-xs)`, `margin-top: var(--space-3)` |
| `.topology-stage` | `margin-top: var(--space-8)`, capped at `70vh` |

All three masthead elements are retained; none is hidden. The masthead SHALL occupy no more than 35% of viewport height. That is a constraint the stylesheet controls directly; a visible-SVG-height target is a byproduct of the diagram's own height and cannot be satisfied by masthead rules alone.

**Touch targets** — node height remains 36px, which meets WCAG 2.5.8 AA (24px minimum) and does not meet 2.5.5 AAA (44px). This is a recorded position, not an oversight.

#### Scenario: Stacked topology height and label clearance at 390px

- **GIVEN** the page at 390×844
- **THEN** `STACK_ROW_PITCH` is the value returned by `stackRowPitch()` for the live node and zone counts, not a literal
- **THEN** the SVG `viewBox` height is ≤ 1200
- **AND** every node label and every zone label is present (`topology.nodes.length` and `topology.zones.length` respectively)
- **AND** the vertical clearance between the bounding boxes of any two adjacent node labels is ≥ 6px

#### Scenario: Landscape phone remains usable

- **GIVEN** a 844×390 viewport with `scrollY === 0`
- **THEN** `.page-header`'s bounding height is ≤ 35% of viewport height
- **AND** the SVG's top edge is within the viewport
- **AND** the `h1` renders on a single line
- **AND** the title, standfirst and readout are all present and legible
- **AND** there is no horizontal overflow

#### Scenario: Bottom sheet does not cover the stage or chain scroll

- **GIVEN** the page at 390px with a node selected
- **THEN** the sheet's height is ≤ 60% of viewport height
- **AND** its top edge is below the vertical midpoint of the SVG's visible area
- **AND** scrolling the sheet to its extent does not scroll the page behind it

#### Scenario: Snap rail does not clip focus

- **GIVEN** the page at 768px
- **WHEN** each scenario entry is focused in turn by keyboard
- **THEN** each entry's focus ring is fully within the rail's visible area

---

### Requirement: Defined states for every interactive surface

**Loading** — before topology data resolves, the stage shows a skeleton at the stage's aspect ratio filled with `var(--surface)`. No spinner, no progress indicator, no text implying a network fetch.

**Empty** — if `scenarios` is an empty array: the scenario list is replaced by the sentence "No scenarios are defined." at `var(--text-sm)` in `var(--ink-muted)`; the idle tour does not start; the topology still renders in full.

**Error** — the topology and scenario data import SHALL be moved behind a dynamic `import()` inside a `try`/`catch` in `src/main.ts`, because `src/data/load.ts` throws at module scope and a static import aborts before any render code runs. On a caught throw the stage region is replaced by a message naming the failing id at `var(--text-base)` in `var(--ink)` with a link to the repository. No stack trace. Masthead, Decisions and footer still render.

**Hover** — nodes and scenario entries change border weight from `var(--border-hair)` to `var(--border-emphasis)` over `var(--motion-fast)` with `var(--ease-standard)`. No transform, no shadow, no scale. Edges have no hover affordance and their `pointer-events` are unchanged.

**Pressed** — scenario entries take background `var(--surface-2)` over `var(--motion-fast)`. No transform.

**Disabled** — applied only when the scenario engine fails to initialise: entries carry `disabled`, render at 50% opacity, and leave the tab order. Disabled SHALL NOT indicate that a scenario is already running.

**Re-activation** — activating the currently running scenario restarts it from zero.

**Reduced motion** — the idle tour does not start; packets do not travel; edges highlight in hop order; arrival pulses fire as colour steps with no width animation; the detail panel enter and exit have zero transition duration.

#### Scenario: Error state is contained and reachable

- **GIVEN** a deliberately broken edge reference in `topology.json`
- **WHEN** the page loads
- **THEN** the stage region shows a message naming that edge id
- **AND** the masthead, Decisions and footer all render
- **AND** no unhandled exception reaches the console

#### Scenario: Rapid re-activation leaves no residue

- **GIVEN** a scenario entry activated ten times in under two seconds
- **WHEN** the DOM is inspected two seconds after the final activation settles
- **THEN** no `circle.packet` remains from a cancelled run
- **AND** no `path.edge` retains an inline `stroke` style from a cancelled run

#### Scenario: Hover is border weight only

- **GIVEN** any node or scenario entry hovered
- **WHEN** its computed `transform`, `box-shadow` and `scale` are read
- **THEN** they are `none`, `none` and `1` respectively

#### Scenario: Reduced motion is a complete alternative

- **GIVEN** `prefers-reduced-motion: reduce` active, set at the OS level
- **WHEN** a scenario is played
- **THEN** no `circle.packet` has a running `offset-distance` animation
- **AND** edges highlight in hop order
- **AND** the caption updates
- **AND** the detail panel's computed `transition-duration` is `0s`
- **AND** the idle tour has not started

---

### Requirement: No implication of live telemetry

No copy, label, state or visual treatment introduced by this change SHALL imply live data, uptime, real-time health, or current system state.

Prohibited in new user-visible strings: "live", "uptime", "status", "online", "offline", "healthy", "real-time", "monitoring", "latency", and any bare unit of time or rate.

#### Scenario: Copy audit

- **GIVEN** all user-visible strings introduced by this change
- **THEN** none contains a prohibited term

---

### Requirement: Existing capabilities do not regress

The composition capability's tokens, editorial two-column Flows and Decisions, sticky section headings and raw-length discipline SHALL continue to hold. The `phase-13a` keyboard model SHALL continue to hold. Packet animation behaviour SHALL be unchanged.

#### Scenario: Raw-length discipline survives

- **GIVEN** the post-change stylesheet
- **WHEN** `grep -nE '[0-9]+(\.[0-9]+)?(rem|px|em)' src/style.css | grep -v ':root'` is run and every hit classified
- **THEN** every hit is a border width, outline offset, SVG geometry, or `.sr-only` clip geometry

#### Scenario: Composition sections unchanged

- **GIVEN** the page at 1440px
- **THEN** Flows and Decisions each render as a two-column grid with a sticky `var(--text-2xl)` Fraunces heading
- **AND** flow-row accent bars are present

#### Scenario: Keyboard model survives

- **GIVEN** the page at 1440px
- **THEN** exactly one `[data-node-id][tabindex="0"]` exists
- **AND** Tab into the SVG then Tab again leaves the SVG

#### Scenario: packet.ts is untouched

- **GIVEN** the diff for this change
- **THEN** `src/packet.ts` does not appear in the changed file list
