# site-structure Specification

## Purpose
Provides the quiet, readable page structure around the interactive topology so visitors can understand system scale, follow each scripted flow, inspect the engineering rationale, and reach the public source without turning the showcase into a dashboard.

## Requirements

### Requirement: Hero readout presents derived and authored machine values

The page SHALL render one lowercase IBM Plex Mono readout directly beneath the hero standfirst. It SHALL present, in order, the node count, resident model count, briefing time, and Qwen throughput, with values separated by spaced middle dots. The node count SHALL be derived from the loaded topology nodes; the other values SHALL come from a small typed `readout.json` data source. The readout SHALL not be rendered as cards, tiles, or big-number metrics.

#### Scenario: Readout reflects the current topology and authored values

- **GIVEN** the topology contains 22 nodes and the readout data contains resident model count `1`, briefing time `08:30`, and Qwen throughput `~170 tok/s`
- **WHEN** the page loads
- **THEN** the hero shows one lowercase line equivalent to `nodes 22 · resident models 1 · briefing 08:30 · qwen ~170 tok/s`

#### Scenario: Readout remains usable on a narrow viewport

- **GIVEN** the viewport is 380px wide
- **WHEN** the hero readout is laid out
- **THEN** it wraps at word/value boundaries without horizontal overflow, clipped text, or a card-like replacement treatment

### Requirement: Flows section describes every scripted scenario

The page SHALL place a Flows section below the topology diagram and its existing caption/rail context. It SHALL contain exactly one full-width row for each scenario in `scenarios.json`, in data order. Each row SHALL include the scenario name in Fraunces, a concise two-sentence plain-language description expanded from that scenario's caption, and a play control. Each row SHALL have a 3px left accent in the dominant flow hue represented by its scenario's referenced hops. Rows SHALL be separated by spacing alone, with no inter-row borders or card containers.

#### Scenario: Five scenario rows are available as prose

- **GIVEN** `scenarios.json` contains the five named scenarios
- **WHEN** the Flows section renders
- **THEN** it contains five full-width prose rows with the names Morning briefing, Task from Discord, Model swap, Health sweep, and Off-network access, and each description is two plain-language sentences rather than a copied one-line caption

#### Scenario: Row accents follow scenario flow meaning

- **GIVEN** a scenario references hops with known edge kinds
- **WHEN** its Flows row renders
- **THEN** the row's 3px accent uses the CSS custom-property hue of the dominant referenced kind, with deterministic tie handling, and no decorative accent or border is added elsewhere in the row

### Requirement: Flows play controls share the rail engine and state

Each Flows play control SHALL invoke the same scenario engine and scenario id used by its corresponding rail button. Activating a Flows control SHALL bring the topology stage into view and start that scenario. The Flows row and control SHALL expose the same running/stopped state, progress treatment, accessible status, and reset behavior as the corresponding rail button; there SHALL be one source of truth for playback state rather than independent runs.

#### Scenario: A Flows control starts the same scenario as the rail

- **GIVEN** a stopped scenario row and its matching rail button
- **WHEN** the row's play control is activated
- **THEN** the topology stage is scrolled into view, the shared engine starts the matching scenario, and both the row and rail button immediately show the identical running treatment and status

#### Scenario: Stopping or replacing a run mirrors everywhere

- **GIVEN** one scenario is running and another scenario is selected from either the rail or Flows section
- **WHEN** the shared engine changes the active scenario or stops
- **THEN** the previous row and rail button return to stopped state, the new matching row and rail button reflect the same active state, and progress resets or advances exactly once for the shared run

#### Scenario: New controls are keyboard accessible

- **GIVEN** a keyboard user tabs through the page
- **WHEN** focus reaches a Flows play control and the user presses Enter or Space
- **THEN** the control is visibly focused, activates without requiring a pointer, scrolls the stage into view, and exposes an accessible name plus its running/stopped status

#### Scenario: Reduced motion keeps control behavior usable

- **GIVEN** `prefers-reduced-motion: reduce` is active
- **WHEN** a Flows play control is activated
- **THEN** the same shared scenario engine and mirrored running/stopped state are used, stage scrolling does not require smooth motion, and the existing reduced-motion packet and progress behavior remains in force

### Requirement: Decisions section explains the engineering constraints

The page SHALL place a Decisions section after Flows with exactly three unornamented prose blocks. The blocks SHALL explain, respectively, one model resident at a time, memory living outside the inference box, and nothing being exposed publicly. Each block SHALL use a Fraunces heading and two or three sentences of engineering reasoning in the established inspector-copy voice; no card, icon, decorative rule, or entrance animation SHALL be required.

#### Scenario: Decisions make the three constraints legible

- **GIVEN** a visitor reads the page below the Flows section
- **WHEN** the Decisions section is displayed
- **THEN** the visitor can identify all three constraints and read two or three sentences of plain engineering reasoning for each without relying on colour, motion, or ornament

### Requirement: Footer provides only source attribution

The page SHALL end with one minimal footer line containing a link to `https://github.com/njvenis/homelab-showcase` and the exact sentence `Built with the stack it describes.` It SHALL contain no additional navigation, metrics, badges, or promotional copy.

#### Scenario: Footer exposes the public source and required sentence

- **GIVEN** the visitor reaches the end of the page
- **WHEN** the footer is rendered
- **THEN** one line contains an accessible GitHub repository link and the exact required sentence, with no other footer content

### Requirement: Existing topology experience remains unchanged

The site-structure addition SHALL preserve the existing scenario rail, caption, inspector, topology stage rendering, node interaction, packet lifecycle, and scenario semantics. New surrounding sections SHALL not introduce a second diagram, alter topology internals, or replace text/non-colour state cues with colour alone.

#### Scenario: Existing diagram behavior survives the structural additions

- **GIVEN** the page includes the new hero, Flows, Decisions, and footer structure
- **WHEN** a visitor uses the existing rail, clicks a node, opens/closes the inspector, or observes a scenario caption
- **THEN** the existing stage, rail, inspector, caption, and scenario behavior remain available and unchanged apart from the new Flows control and scroll entry point
