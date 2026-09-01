# flow-focus Specification

## Purpose

Makes the topology legible under attention without simplifying it: focus states that dim what is not currently relevant, a path readout that shows a scenario's script in advance, scenario metadata derived from the data, a context tier for the external zone, and a data-derived legend.

The page presents scripted, synthetic flows. No requirement here introduces live telemetry, metrics, uptime or health.

**Depends on** `phase-13b-stage-composition` having shipped — `.control-column` must exist.

**Architectural constraints binding on every requirement:**

- `src/packet.ts` is NOT modified. No rule may set `opacity`, `stroke`, `display`, `offset-path`, `offset-distance` or `--packet-flow` on `path.edge`, `path.edge-glow` or `circle.packet`.
- Nodes already render inside `<g class="node-control" data-node-id="…" role="button">` (`src/main.ts` ~151). **No additional node wrapper is introduced.** Node dimming targets that existing element. Nothing else may carry `data-node-id`, or the `nodeControls` map (~244) and the arrival-pulse lookup (~602) break.
- Packets are appended to the SVG root (`src/packet.ts:149`, `svg.append(packet)`). They are therefore never children of an edge group and are never dimmed. This is intentional; packets must not be moved into groups.
- `renderTopology` concatenates `zoneEls + edgeEls + nodeEls`. Edge groups must stay in the edge band or nodes will render beneath edges.

**File and function map** (`src/main.ts` @ `157da44`): edge markup ~130–141; node markup ~143–158; SVG assembly ~160; `renderScenarioRail` ~163; `renderLegend` ~182; `legendEntries` literal array; arrival pulse ~602; tour and `subscribe` ~700–720.

---

## ADDED Requirements

### Requirement: Focus tokens

The following SHALL be added to `:root` in `src/style.css`.

| Token | Value | Consumer |
|---|---|---|
| `--dim-inactive-edge` | `0.35` | `opacity` of unfocused `g.edge-group` |
| `--dim-inactive-node` | `0.55` | `opacity` of unfocused `g.node-control` |
| `--zone-context-fill` | `color-mix(in oklch, var(--surface) 60%, var(--substrate))` | fill of zones with `emphasis: context` |
| `--motion-base` | `220ms` | focus dimming transition |

Two dim values, not one: node groups contain label text, and 0.35 would take that text below the contrast floor. Node labels are additionally exempted from group opacity (see the accessibility requirement).

#### Scenario: Tokens present with exact values

- **GIVEN** `src/style.css` after this change
- **THEN** each token above exists with the exact value specified
- **AND** the six `--flow-*`, six `--edge-idle-*` and six `--bloom-*` tokens are byte-identical to before the change

---

### Requirement: Edges are wrapped so dimming cannot collide with packet animation

Each edge SHALL render inside `<g class="edge-group" data-edge-id="{id}">` containing the existing `path.edge-glow` and `path.edge` unchanged — same classes, same `id`, same `data-edge-id`, same marker attributes, same `d`.

No node wrapper is added. Node dimming targets the existing `g.node-control`.

Focus dimming SHALL be applied only as `opacity` on `g.edge-group` and `g.node-control`.

`src/packet.ts` SHALL NOT be modified.

#### Scenario: Packet selectors still resolve

- **GIVEN** the rendered topology after this change
- **THEN** `document.querySelectorAll('path.edge').length` equals `topology.edges.length`
- **AND** `document.querySelectorAll('.edge-glow[data-edge-id]').length` equals the same
- **AND** every `path.edge` `id` equals its wrapping group's `data-edge-id`

#### Scenario: Only one element carries each node id

- **GIVEN** the rendered topology
- **THEN** `document.querySelectorAll('[data-node-id]').length` equals `topology.nodes.length`
- **AND** each is a `g.node-control`

#### Scenario: Document order is preserved

- **GIVEN** the rendered SVG
- **THEN** every element matching `g.edge-group` precedes every element matching `g.node-control` in document order

#### Scenario: Packets are not dimmed and stay at the SVG root

- **GIVEN** a scenario playing with a node selected so most groups are dimmed
- **THEN** every `circle.packet` is a direct child of the `svg` element
- **AND** no `circle.packet` has a computed opacity below 1

#### Scenario: packet.ts is untouched

- **GIVEN** the diff for this change
- **THEN** `src/packet.ts` does not appear in the changed file list

---

### Requirement: Selection focus and playback focus with defined precedence

**Selection focus.** While a node is selected: its `g.node-control`, the `g.node-control` of every adjacent node, and the `g.edge-group` of every incident edge remain at opacity 1. All other edge groups render at `var(--dim-inactive-edge)` and all other node controls at `var(--dim-inactive-node)`, transitioning over `var(--motion-base)` with `var(--ease-out)`.

**Playback focus.** While a scenario runs and no node is selected: the `g.edge-group` of every edge referenced by that scenario's hops and the `g.node-control` of every node those edges touch remain at opacity 1; all others dim as above.

**Precedence.** Selection focus takes precedence. Selecting a node during playback SHALL NOT stop, pause or restart the running scenario. Dismissing the selection restores playback focus if the scenario is still running, or full opacity if it is not.

**Idle tour.** Selecting a node stops the idle tour permanently for the session, consistent with the existing rule that any user interaction stops it.

**Arrival pulses on dimmed nodes SHALL be suppressed** — a pulse fires only on a node control at full opacity.

`src/scenario.ts` SHALL expose the running scenario's participating edge id set and current hop index on its subscribable state. Timing, ordering, determinism and hop semantics are unchanged.

#### Scenario: Selection dims correctly

- **GIVEN** node `swap` selected with no scenario running
- **THEN** `g.node-control[data-node-id="swap"]` and every adjacent node control are at opacity 1
- **AND** every `g.edge-group` whose edge has `from` or `to` equal to `swap` is at opacity 1
- **AND** all remaining edge groups are at `var(--dim-inactive-edge)` and node controls at `var(--dim-inactive-node)`
- **AND** `document.querySelectorAll('path.edge').length` still equals `topology.edges.length`

#### Scenario: Playback dims correctly

- **GIVEN** `off-network-access` playing with no node selected
- **THEN** the edge groups its hops reference are at opacity 1 and all other edge groups are at `var(--dim-inactive-edge)`

#### Scenario: Selection during playback takes precedence without interrupting

- **GIVEN** `discord-task` running
- **WHEN** a node outside its participating set is selected
- **THEN** the focus set becomes the selection set
- **AND** the scenario continues and its hop firing times are unaffected
- **AND** on dismissal the playback focus set is restored while the scenario is still running

#### Scenario: Selection stops the idle tour

- **GIVEN** the idle tour running
- **WHEN** a node is selected
- **THEN** the tour does not advance to another scenario for the remainder of the session

#### Scenario: Focus clears on completion

- **GIVEN** a scenario run to completion with nothing selected
- **THEN** every edge group and every node control is at opacity 1

#### Scenario: Determinism preserved

- **GIVEN** the engine after this change
- **WHEN** `grep -rn 'Math.random' src/` is run
- **THEN** it returns nothing
- **AND** the same scenario played twice fires hops at identical offsets

---

### Requirement: Scenarios are characterised before they are played

Each scenario entry SHALL display its name plus derived metadata in `IBM Plex Mono` at `var(--text-xs)`: hop count as `{n} hops` and duration as `runtime {s}s` to one decimal place.

Both values SHALL be computed at runtime — hop count as `hops.length`, duration as `max(at + duration)` across hops. Neither may be authored into any file under `src/data/`.

**Empty hop array.** A scenario with zero hops SHALL render `0 hops`, SHALL NOT render a runtime figure, and SHALL NOT be playable. `max()` over an empty array yields `-Infinity` and must never reach the DOM.

The scenario list SHALL carry a heading containing the word "Scripted". Every duration figure SHALL be prefixed by `runtime` so it cannot be read as a measured latency.

#### Scenario: Derived metadata is correct and labelled

- **GIVEN** the scenario list rendered
- **THEN** the `health-sweep` entry reads `2 hops` and `runtime 0.8s`
- **AND** the `discord-task` entry reads `17 hops` and `runtime 6.4s`
- **AND** no hop-count or duration literal exists in any file under `src/data/`
- **AND** the list heading contains the word "Scripted"

#### Scenario: Zero-hop scenario degrades safely

- **GIVEN** a scenario temporarily given an empty `hops` array
- **THEN** its entry reads `0 hops` with no runtime figure
- **AND** the string `Infinity` appears nowhere in the rendered document
- **AND** activating it does not start playback or throw

---

### Requirement: The path readout shows the script, not a log

While a scenario is selected or running, `.control-column` SHALL display a **path readout**: that scenario's complete ordered hop list, rendered in advance, one row per hop.

Each row SHALL show the edge's declared `from` label, an arrow, and its `to` label — **always in declared order, never swapped** — plus a distinct indicator where the hop sets `reverse: true`. The row identifies the edge; the indicator carries the direction of travel.

While the scenario runs, the row for the currently firing hop SHALL be marked with background `var(--surface-2)` and a left accent in that hop's flow colour, over `var(--motion-slow)`. Completed rows return to rest. On stop or completion no row is marked. Under `prefers-reduced-motion` the marking is instant.

The readout SHALL NOT be a live region, and SHALL NOT contain timestamps, elapsed counters, scrollback, or newest-first ordering.

The readout is a labelled region named by its own heading via `aria-labelledby`. It SHALL NOT be referenced by `aria-describedby` from a scenario entry — that would make a screen reader announce every hop row as the entry's description.

#### Scenario: The full path is shown before playing

- **GIVEN** `model-swap` selected but not yet played
- **THEN** the readout lists all 6 hops in ascending `at` order
- **AND** no row carries the current-step treatment

#### Scenario: Reverse hops are indicated, not swapped

- **GIVEN** a scenario containing a hop with `reverse: true`
- **THEN** that row shows the edge's declared `from` label first and `to` label second
- **AND** carries a reverse indicator distinguishing it from a forward hop on the same edge

#### Scenario: Current step is marked during playback

- **GIVEN** `model-swap` playing
- **THEN** exactly one row carries the current-step treatment
- **AND** the row order is unchanged from before playback began

#### Scenario: The readout is not a live region

- **GIVEN** the readout element
- **THEN** it has no `aria-live`, no `role="log"`, no `role="status"`
- **AND** no scenario entry references it via `aria-describedby`

#### Scenario: Marking is instant under reduced motion

- **GIVEN** `prefers-reduced-motion: reduce` active
- **THEN** the marked row's computed `transition-duration` is `0s`

---

### Requirement: Zones carry an emphasis tier

`Zone` SHALL gain an optional `emphasis?: 'primary' | 'context'`, defaulting to `'primary'` when absent. `src/data/topology.json` SHALL set `"emphasis": "context"` on the `ext` zone only; `pi` and `wsl` SHALL omit the field so the default path is exercised.

Context zones render with a dashed boundary at `var(--border-hair)`, fill `var(--zone-context-fill)`, and label and sub-label at `var(--ink-muted)`. Primary zones are unchanged.

Both `src/data/load.ts` and `npm run validate` SHALL reject any other value, naming the offending zone id and the invalid value.

#### Scenario: Context zone renders distinctly, primary zones unchanged

- **GIVEN** the rendered topology
- **THEN** the `ext` zone rect has a dashed stroke and a fill differing from `pi` and `wsl`
- **AND** the computed fill, stroke and stroke-dasharray of the `pi` and `wsl` zone rects are identical to their pre-change values

#### Scenario: Absent field defaults to primary

- **GIVEN** a zone object with no `emphasis` key
- **THEN** the loader treats it as `primary` and raises no error

#### Scenario: Invalid emphasis is rejected in both paths

- **GIVEN** a zone with `"emphasis": "secondary"`
- **WHEN** `npm run validate` is run
- **THEN** it exits non-zero naming that zone id and the value
- **AND** loading the page throws an error naming the same zone id

---

### Requirement: Legend is derived from edge kinds

Legend entries SHALL be derived from the distinct `kind` values present in `topology.json` **edges**, replacing the `legendEntries` literal array in `src/main.ts`. Not node kinds — the legend explains flows, and the two are not the same multiset in this data (memory: 1 node, 2 edges).

Entry order SHALL be the fixed canonical order `control, infer, memory, health, network, egress`, filtered to the kinds present, so the legend is deterministic regardless of data ordering.

#### Scenario: Legend follows edge data in canonical order

- **GIVEN** all `egress` edges temporarily removed from `topology.json`
- **THEN** the legend shows exactly five entries, none of them `egress`
- **AND** with the data restored it shows six in the canonical order

---

### Requirement: Zone layout coverage is validated

`npm run validate` SHALL fail if `topology.json` contains a zone with no corresponding entry in the wide layout's zone map, naming the zone id and stating that a layout entry is missing.

This is a guard, not a refactor. The wide layout's hardcoded rectangles are unchanged; the guard makes their coupling to the data detectable rather than silently rendering `undefined` coordinates.

#### Scenario: An unlaid-out zone fails validation

- **GIVEN** a fourth zone added to `topology.json` with no layout entry
- **WHEN** `npm run validate` runs
- **THEN** it exits non-zero, names that zone id, and states that a layout entry is missing

---

### Requirement: Dimming never takes text below the contrast floor

Node labels SHALL be exempted from their group's dimming opacity, so a dimmed node's label remains readable. Zone labels in context-emphasis zones SHALL meet WCAG AA against `var(--zone-context-fill)`.

Lighthouse accessibility SHALL remain 100 at 390px and 1440px.

#### Scenario: Dimmed node labels stay readable

- **GIVEN** a node selected so most node controls are dimmed
- **WHEN** the contrast of a dimmed node's label against the substrate is measured
- **THEN** it meets WCAG AA

#### Scenario: Context zone label contrast

- **GIVEN** the `ext` zone rendered with `var(--zone-context-fill)`
- **WHEN** its label and sub-label contrast is measured against that fill
- **THEN** both meet WCAG AA

#### Scenario: Audit holds

- **GIVEN** the built site
- **WHEN** axe or Lighthouse runs at 390px and 1440px
- **THEN** the score is 100 at both with no contrast violations

---

### Requirement: Reduced motion is a complete alternative

Under `prefers-reduced-motion: reduce`: focus dimming applies instantly with zero transition duration; path-readout marking is instant; packets do not travel; edges highlight in hop order; arrival pulses fire as colour steps; the idle tour does not start.

#### Scenario: No transitions on dimmed groups

- **GIVEN** `prefers-reduced-motion: reduce` set at the OS level
- **WHEN** a node is selected
- **THEN** the computed `transition-duration` of every dimmed `g.edge-group` and `g.node-control` is `0s`
- **AND** the focus state is nonetheless applied

#### Scenario: Playback remains comprehensible

- **GIVEN** reduced motion active
- **WHEN** a scenario is played
- **THEN** no `circle.packet` has a running `offset-distance` animation
- **AND** edges highlight in hop order
- **AND** the caption and path readout both update

---

### Requirement: No implication of live telemetry

No copy, label, state or visual treatment introduced by this change SHALL imply live data, uptime, real-time health, or current system state.

Prohibited in new user-visible strings: "live", "uptime", "status", "online", "offline", "healthy", "real-time", "monitoring", "latency", and any bare unit of time or rate not prefixed by a word establishing it as scripted.

The path readout is prohibited from newest-first ordering, timestamps, elapsed counters and scrollback.

#### Scenario: Copy audit

- **GIVEN** all user-visible strings introduced by this change
- **THEN** none contains a prohibited term
- **AND** every duration figure is prefixed by `runtime`
- **AND** the scenario list heading names the flows as scripted

---

### Requirement: Existing capabilities do not regress

The composition and stage-composition capabilities SHALL continue to hold. The `phase-13a` keyboard model SHALL continue to hold. The data-model capability's invariants SHALL continue to hold, including the rule that a hop setting `reverse` on a non-bidirectional edge is rejected.

#### Scenario: Reverse-on-one-way rule still enforced

- **GIVEN** a hop setting `reverse: true` on `n8n-resend`
- **WHEN** `npm run validate` runs
- **THEN** it exits non-zero naming that hop and edge

#### Scenario: Fold and composition survive

- **GIVEN** the page at 1440×900 under the stage-composition measurement procedure
- **THEN** the SVG's `top` is still ≤ 340
- **AND** Flows and Decisions still render as two-column grids with sticky headings

#### Scenario: Keyboard model survives

- **GIVEN** the page at 1440px
- **THEN** exactly one `[data-node-id][tabindex="0"]` exists
- **AND** Escape from detail returns focus to the invoking node
