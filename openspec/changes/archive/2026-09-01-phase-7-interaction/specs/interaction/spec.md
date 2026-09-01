## Purpose

Provides an accessible interaction layer for exploring scripted topology scenarios and reading the engineering role and current status of each node.

## ADDED Requirements

### Requirement: Nodes expose an accessible inspector

The site SHALL make every rendered topology node an interactive control. Activating a node SHALL open an inspector containing that node's label, zone, kind, and detail text.

#### Scenario: Opening a node inspector

- **GIVEN** a topology node is visible on the canvas
- **WHEN** a visitor clicks or activates that node
- **THEN** an inspector opens and identifies the node's label, zone, kind, and detail

### Requirement: Open inspectors dim the canvas

While the node inspector is open, the topology canvas behind it SHALL be visibly dimmed so the inspector is the active reading surface. The inspector content SHALL remain readable and operable.

#### Scenario: Canvas dims behind inspector

- **GIVEN** a visitor has opened a node inspector
- **WHEN** the inspector is visible
- **THEN** the topology canvas is visibly dimmed while the inspector remains readable and interactive

### Requirement: Inspector dismissal restores invoking focus

The inspector SHALL be dismissible with Escape. After dismissal, keyboard focus SHALL return to the node that opened the inspector.

#### Scenario: Escape closes inspector and restores focus

- **GIVEN** a node opened the inspector and focus is within the open inspector
- **WHEN** the visitor presses Escape
- **THEN** the inspector closes, the canvas is no longer dimmed, and focus returns to the node that opened it

### Requirement: Nodes are keyboard reachable and visibly focused

Every topology node SHALL be reachable through sequential keyboard navigation, and the currently focused node SHALL have a visible focus ring that is distinguishable against the canvas.

#### Scenario: Keyboard traversal reaches every node

- **GIVEN** a visitor navigates the page using a keyboard
- **WHEN** they advance focus through the topology controls
- **THEN** every rendered topology node can receive focus and the focused node has a visible focus ring

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
