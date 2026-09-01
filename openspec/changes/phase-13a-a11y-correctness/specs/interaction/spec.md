# interaction Specification

## Purpose

Corrects three accessibility defects in the shipped page: an arrival live region that announces once per packet, a static readout declared as a live region, and a 21-stop tab sequence inside the SVG with no focus-return contract.

This change is visual-only-neutral. It introduces no design change, no token, no layout change, and no new element. It can be reviewed and shipped without a design pass, and reverted independently of any later change.

**File and function map** (`src/main.ts` @ `157da44`):

| Concern | Location |
|---|---|
| Node `<g class="node-control">` markup, `role="button" tabindex="0"` | ~151 |
| `nodeControls` map population | ~227–244 |
| Inspector open, `data-selected`, focus to close button | ~289–337 |
| Inspector close, focus return | ~346–352 |
| `subscribe` handler, arrival live-region write | ~700–715 |
| `#hero-readout` write | ~767 |
| `#hero-readout` attributes | `index.html` ~13 |

---

## MODIFIED Requirements

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

### Requirement: The node layer is a single tab stop with roving focus

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

---

### Requirement: Focus returns to the invoking node

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

---

## ADDED Requirements

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
