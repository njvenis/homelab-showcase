# interaction Specification

## Purpose
Provides an accessible interaction layer for exploring scripted topology scenarios and reading the engineering role and current status of each node.

## Requirements

### Requirement: Nodes expose an accessible inspector

The site SHALL make every rendered topology node an interactive control. Activating a node SHALL open an inspector containing that node's label, zone, kind, and detail text.

#### Scenario: Opening a node inspector

- **GIVEN** a topology node is visible on the canvas
- **WHEN** a visitor clicks or activates that node
- **THEN** an inspector opens and identifies the node's label, zone, kind, and detail

### Requirement: Inspector does not dim or obscure the canvas

**Current behaviour.** An earlier iteration exposed the inspector as a modal dialog backed by a `.canvas-dimmer` layer that dimmed the topology while open.

**Required behaviour.** The node inspection panel is a non-overlay panel populated in the control column; no `.canvas-dimmer` exists and none SHALL be introduced. While the inspector is open, the topology stays fully visible and legible: the panel SHALL NOT overlap, dim or obscure the topology at any width ≥ 768px, and the inspector content SHALL remain readable and operable.

#### Scenario: Inspector renders without dimming the canvas

- **GIVEN** a visitor has opened a node inspector
- **WHEN** the inspector is visible
- **THEN** no dimming element exists (`document.querySelector('.canvas-dimmer')` is null)
- **AND** the topology remains fully visible and legible — it is not overlapped, dimmed or obscured
- **AND** the inspector content remains readable and operable

### Requirement: Inspector dismissal restores invoking focus

**Current behaviour.** Opening the inspector moves focus to its close button (`closeInspectorButton.focus()`), which is correct for a modal dialog.

**Required behaviour.** Focus SHALL return to the node that opened the detail when it is dismissed by Escape or by the close control. Escape SHALL dismiss the detail from anywhere within it or from the node layer.

Opening behaviour is unchanged in this change — the element is still a modal dialog here. Focus-on-open is revised in `phase-13b-stage-composition`, where the element stops being modal.

#### Scenario: Escape returns focus

- **GIVEN** detail opened from node `mnemosyne` by keyboard
- **WHEN** Escape is pressed
- **THEN** detail is dismissed and `document.activeElement` is the `mnemosyne` node
- **AND** that node carries `tabindex="0"`

#### Scenario: Close control returns focus

- **GIVEN** detail opened from node `swap`
- **WHEN** the close control is activated by keyboard
- **THEN** `document.activeElement` is the `swap` node

#### Scenario: Escape closes inspector and restores focus

- **GIVEN** a node opened the inspector and focus is within the open inspector
- **WHEN** the visitor presses Escape
- **THEN** the inspector closes and focus returns to the node that opened it

---

### Requirement: Nodes are keyboard reachable and visibly focused

**Current behaviour.** Every node renders as `<g class="node-control" … role="button" tabindex="0">`. With 21 nodes, traversing past the diagram by keyboard requires 21 Tab presses.

**Required behaviour.** Exactly one node SHALL carry `tabindex="0"` at any time; all others SHALL carry `tabindex="-1"`. Arrow keys move focus between nodes in document order and update which node holds `tabindex="0"`. Home and End move to the first and last node. Enter or Space opens the node detail. The existing `role="button"`, `aria-label`, `data-node-id`, `data-node-kind` and `focusable` attributes are unchanged.

Arrow-key handling SHALL be bound on the node layer, not on `document`, so it does not intercept arrow keys elsewhere on the page.

#### Scenario: One tab stop

- **GIVEN** the page at 1440px
- **WHEN** Tab is pressed until focus enters the SVG, then Tab is pressed once more
- **THEN** focus leaves the SVG entirely rather than moving to a second node
- **AND** `document.querySelectorAll('[data-node-id][tabindex="0"]').length` is 1

#### Scenario: Arrow keys traverse every node

- **GIVEN** focus on the first node
- **WHEN** ArrowRight is pressed `topology.nodes.length - 1` times
- **THEN** each node receives focus exactly once in document order, for all `topology.nodes.length` of them
- **AND** each shows a visible focus indicator
- **AND** after each move exactly one node carries `tabindex="0"`

#### Scenario: Home and End

- **GIVEN** focus on any node
- **WHEN** End is pressed, then Home
- **THEN** focus moves to the last node, then the first

#### Scenario: Arrow keys elsewhere are unaffected

- **GIVEN** focus on a scenario button or a page link
- **WHEN** ArrowRight is pressed
- **THEN** node focus does not change

#### Scenario: Keyboard traversal reaches every node

- **GIVEN** a visitor navigates the page using a keyboard
- **WHEN** they advance focus through the topology controls
- **THEN** every rendered topology node can receive focus and the focused node has a visible focus ring

---

### Requirement: Scenario rail controls playback state

The scenario selector rail SHALL expose each available scenario as a keyboard-operable control. It SHALL visibly distinguish the scenario currently running, including when a visitor starts a scenario from the rail.

#### Scenario: Keyboard visitor starts a scenario

- **GIVEN** the scenario selector rail is focused
- **WHEN** the visitor moves to a scenario control and activates it with the keyboard
- **THEN** that scenario starts playing and its control visibly identifies it as the running scenario

#### Scenario: Running scenario remains identified during playback

- **GIVEN** a scenario is playing
- **WHEN** the playback advances through its scripted flow
- **THEN** the rail continues to identify that scenario as running until playback ends or another scenario is activated

### Requirement: Transitional status is explained in the inspector

When a node is marked transitional in the topology data, its inspector SHALL visibly state that the node is transitional and communicate the status conveyed by its detail content. Nodes without that status SHALL not be presented as transitional.

#### Scenario: Transitional node status is shown

- **GIVEN** a visitor opens the inspector for a node marked transitional
- **WHEN** the inspector renders the node information
- **THEN** the inspector visibly labels the node as transitional alongside its label, zone, kind, and detail

#### Scenario: Stable node has no transitional label

- **GIVEN** a visitor opens the inspector for a node not marked transitional
- **WHEN** the inspector renders the node information
- **THEN** the inspector does not display a transitional status label

### Requirement: Legend explains every flow colour

The page SHALL display a legend with one entry for each of the five flow kinds: control, memory, inference, health, and egress. Each entry SHALL pair the flow colour with its meaning.

#### Scenario: Visitor interprets flow colours

- **GIVEN** a visitor views the topology page
- **WHEN** they consult the flow legend
- **THEN** they can map the control, memory, inference, health, and egress colours to their meanings

### Requirement: Arrival announcements are bounded to one per scenario

**Current behaviour.** The `subscribe` handler writes `arrivalLive.textContent` on every packet arrival. `discord-task` fires 17 arrivals in 6.43 seconds, and the idle tour loops all five scenarios indefinitely from page load, so a screen reader receives continuous unstoppable announcement.

**Required behaviour.** The live region SHALL announce exactly once when a scenario starts, naming the scenario, and exactly once on completion. It SHALL NOT announce individual packet arrivals. `emitArrivalPulse` is unchanged — the visual pulse is retained.

#### Scenario: Announcement count is bounded

- **GIVEN** `discord-task`, which fires 17 arrivals
- **WHEN** it runs to completion with a `MutationObserver` attached to `#scenario-arrival`
- **THEN** exactly two mutations are recorded
- **AND** neither announcement text contains a node label belonging to an individual hop

#### Scenario: Idle tour does not announce continuously

- **GIVEN** the idle tour left running for three full cycles
- **WHEN** live-region mutations are counted
- **THEN** the count equals exactly two per scenario played

#### Scenario: Arrival pulses are retained

- **GIVEN** a scenario playing with reduced motion off
- **WHEN** a packet arrives at a node
- **THEN** that node's border pulse still fires

---

### Requirement: The hero readout is not a live region

**Current behaviour.** `#hero-readout` carries `role="status"` and `aria-live="polite"` in `index.html`, but its content is written once at load from `readout.json` and never changes, producing a spurious announcement of static facts.

**Required behaviour.** Both attributes SHALL be removed. The element and its content are otherwise unchanged.

#### Scenario: Attributes removed, content intact

- **GIVEN** `index.html` after this change
- **WHEN** `#hero-readout` is inspected
- **THEN** it carries neither `role="status"` nor `aria-live`
- **AND** its rendered text still contains the briefing time, resident-model count and throughput values

---

### Requirement: No regression to existing keyboard and audit baselines

Lighthouse accessibility SHALL remain 100 at 390px and 1440px. Every scenario button, node and link SHALL remain reachable by keyboard with a visible focus indicator. No visual change SHALL be introduced by this change.

#### Scenario: Audit holds

- **GIVEN** the built site
- **WHEN** an axe or Lighthouse accessibility audit runs at 390px and 1440px
- **THEN** the score is 100 at both, matching the pre-change baseline

#### Scenario: No visual diff

- **GIVEN** screenshots at 390, 768, 1024 and 1440 in idle state
- **WHEN** diffed against the pre-change baselines
- **THEN** no pixel difference is present outside focus indicators
