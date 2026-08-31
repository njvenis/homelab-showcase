## Purpose

Defines the v2 lit visual language for the static topology so flow kind remains legible at rest, traffic remains the strongest motion cue, and the presentation stays understandable and accessible.

## ADDED Requirements

### Requirement: Idle edges show their semantic flow kind

Every rendered edge SHALL use the derived idle token for its kind when it has no active traffic: control SHALL use `--edge-idle-control`, memory `--edge-idle-memory`, infer `--edge-idle-infer`, health `--edge-idle-health`, egress `--edge-idle-egress`, and network `--edge-idle-network`. Each idle edge SHALL have only a faint glow in the same hue, while structural rules may remain `--rule`.

#### Scenario: Idle topology is lit by kind

- **GIVEN** the topology is rendered and no packet is traversing an edge
- **WHEN** the visitor views the diagram
- **THEN** the edge stroke and its faint glow use the edge's kind-specific `--edge-idle-*` hue, all six kinds are distinguishable by the legend text and hue, and no existing flow hue is changed

### Requirement: Traffic brightens edges and fades back safely

An edge with traffic SHALL rise to its full `--flow-*` hue and its glow SHALL follow that hue. When traffic ends, the edge SHALL retain the existing fade-back behavior and return to its kind-specific idle treatment. Overlapping traffic SHALL be reference-counted so an edge does not fade while another packet remains active.

#### Scenario: Active traffic brightens and then fades

- **GIVEN** an idle edge has a packet scheduled to traverse it
- **WHEN** the packet starts and later completes
- **THEN** the edge brightens to its full flow hue while active and fades back to its kind-specific idle hue after the existing fade interval

#### Scenario: Overlapping traffic keeps an edge bright

- **GIVEN** two packets overlap on the same edge
- **WHEN** the first packet completes while the second remains active
- **THEN** the edge and glow remain at the full flow hue until the final active packet completes, then fade back once

#### Scenario: Reduced motion preserves edge timing without travel

- **GIVEN** the visitor has enabled reduced motion and a scenario is playing
- **WHEN** a hop becomes active and completes
- **THEN** no packet visibly travels, the edge still brightens for the hop's duration, and the edge still fades back without disabling the scenario

### Requirement: Nodes show kind presence without losing status cues

Each node SHALL retain its substrate fill and SHALL gain a 3px left-edge accent in its kind hue at 60% opacity plus a fill tint mixed from 6% of that kind hue. The transitional dash treatment SHALL remain visible above the new presence treatment for transitional nodes.

#### Scenario: Node presence uses the node kind

- **GIVEN** a node is rendered in the topology
- **WHEN** the visitor views the node at rest
- **THEN** its substrate-backed box has the node kind's 60%-opacity left accent and 6%-hue fill tint, and its label remains readable

#### Scenario: Transitional treatment remains visible

- **GIVEN** a node is marked transitional in topology data
- **WHEN** the node is rendered with its kind accent
- **THEN** the transitional dashed outline remains visible on top of the presence treatment

### Requirement: The stage uses one restrained semantic bloom

The diagram stage SHALL have one radial bloom behind the topology using the `--bloom-*` values of the two dominant flow hues in the current topology. The bloom SHALL be subtle enough to be felt rather than read as an object, and the stage SHALL contain no dot grid or vignette.

#### Scenario: Lit stage has a quiet two-hue bloom

- **GIVEN** the diagram stage is visible
- **WHEN** the visitor views the background behind the topology
- **THEN** one restrained radial bloom combines the two dominant topology hues behind the diagram, without obscuring nodes, edges, labels, or focus indicators, and no dot grid or vignette is present

### Requirement: Idle tour stops at interaction boundaries

The idle tour SHALL use the existing phase-9 idle-tour timing and stops, and SHALL not compete with deliberate interaction. It SHALL stop when the visitor interacts with the page, starts a scenario, opens the inspector, the document becomes hidden, the tour reaches its final configured stop, or reduced motion is enabled. It SHALL not start or resume while reduced motion is enabled.

#### Scenario: Untouched page starts the idle tour

- **GIVEN** the page is visible, reduced motion is not enabled, and the visitor has not interacted for the existing idle delay
- **WHEN** the idle-tour delay elapses
- **THEN** the tour advances through its configured stops using the existing scenario/edge presentation

#### Scenario: Deliberate interaction stops the tour

- **GIVEN** the idle tour is running
- **WHEN** the visitor clicks, presses a key, starts a scenario, opens the inspector, or the document becomes hidden
- **THEN** the tour stops and does not restart until the existing idle conditions are satisfied again

#### Scenario: Reduced motion prevents the tour

- **GIVEN** reduced motion is enabled before or during the idle period
- **WHEN** the idle delay would elapse or the preference changes
- **THEN** the tour does not start, or stops immediately if already running, and no travelling-packet presentation is shown

### Requirement: Arrival pulses and progress remain understandable

Normal-motion arrival pulses SHALL identify the destination node when a packet arrives, and the progress treatment SHALL report the running scenario's progress through its scripted hops. Reduced motion SHALL replace arrival movement or opacity animation with an instantaneous kind-colour step while retaining progress and caption updates.

#### Scenario: Normal motion shows arrival and progress

- **GIVEN** a scenario is running without reduced motion
- **WHEN** each packet arrives at its destination and the scenario advances
- **THEN** the destination receives the existing arrival pulse, the progress treatment advances deterministically, and the caption remains synchronized with the scripted flow

#### Scenario: Reduced motion uses colour-step arrivals

- **GIVEN** a scenario is running with reduced motion enabled
- **WHEN** a hop arrives at its destination
- **THEN** the destination communicates the arrival as an instantaneous kind-colour step with no scale or opacity animation, while progress and captions continue to update

#### Scenario: Progress completes with the scenario

- **GIVEN** a scenario has reached its final scripted hop
- **WHEN** all active hops finish
- **THEN** progress reports completion, the running state clears, and no stale progress or arrival pulse claims that the scenario is still active

### Requirement: The legend previews all six edge kinds

The flow legend SHALL contain exactly six entries: control, memory, inference, health, egress, and network. Each entry SHALL pair its text meaning with a short lit dash using the corresponding full flow hue and a faint same-hue glow; no entry may rely on colour alone.

#### Scenario: Visitor reads the six-kind legend

- **GIVEN** the topology page is displayed
- **WHEN** the visitor consults the flow legend
- **THEN** six labelled entries are present, including network, and each swatch is a short glowing line segment that previews an edge rather than a dot

### Requirement: Section kickers are removed from the visual language

The page SHALL not render the uppercase tracked `.section-kicker` treatment. Information formerly carried by a kicker SHALL either be folded into the associated heading when meaningful or omitted when redundant.

#### Scenario: No tracked kicker chrome remains

- **GIVEN** the page is rendered
- **WHEN** the visitor scans headings, rail content, legend content, and inspector content
- **THEN** no uppercase tracked kicker is displayed and any retained information is expressed in normal heading or body copy

### Requirement: Lit presentation preserves accessibility quality

The lit treatment SHALL preserve readable text and visible focus indicators across supported layouts and SHALL achieve a Lighthouse accessibility score of 100. Hue, glow, bloom, pulse, and progress SHALL supplement rather than replace text or other non-colour cues.

#### Scenario: Lit colours do not reduce text contrast

- **GIVEN** text or a focus indicator is displayed over the substrate, surface, surface-2, stage bloom, or lit topology
- **WHEN** the production page is evaluated for contrast
- **THEN** all applicable text and focus indicators remain distinguishable and no lit treatment lowers text contrast below the accessibility requirement

#### Scenario: Lighthouse remains perfect

- **GIVEN** the production page is loaded at its deployed base path
- **WHEN** Lighthouse accessibility auditing is run
- **THEN** the accessibility score is 100 with no failed accessibility audits

#### Scenario: Motion cues are not the only meaning

- **GIVEN** a visitor cannot perceive colour or motion
- **WHEN** they inspect the legend, captions, controls, or node details
- **THEN** flow meanings, running state, progress, arrivals, and node information remain available through text and control state
