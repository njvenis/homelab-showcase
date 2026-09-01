## Purpose

Provides resilient, inclusive presentation of the topology across motion preferences, narrow viewport layouts, and assistive-technology access without changing the underlying topology or scenario data.

## ADDED Requirements

### Requirement: Reduced motion preserves scenario comprehension

When a visitor has enabled the operating system's reduced-motion preference, scenario playback SHALL not animate packets travelling along edges. Each hop SHALL instead be communicated by highlighting its edge for that hop's duration and then fading the highlight, while the scenario caption continues stepping through the scripted flow. Scenarios SHALL remain available and comprehensible; reduced motion SHALL not disable playback.

#### Scenario: Reduced-motion playback uses edge highlights
- **GIVEN** the operating system has reduced motion enabled and a visitor starts a scenario
- **WHEN** the scenario advances through its scripted hops
- **THEN** no packet travels across the topology, the active edge highlights for each hop duration and fades, and the caption advances for every scripted step

#### Scenario: Normal-motion playback remains available
- **GIVEN** the operating system does not request reduced motion
- **WHEN** a visitor starts a scenario
- **THEN** the existing travelling-packet presentation remains available and the scenario caption follows the scripted steps

### Requirement: Narrow viewports use a readable stacked topology

The page SHALL remain usable at viewport widths down to 380px. Below roughly 900px, the three topology zones SHALL stack vertically, and every SVG edge SHALL connect the corresponding node positions in the active layout, including edges crossing between stacked zones. On narrow viewports, the node inspector SHALL present as a bottom sheet that remains readable and operable.

#### Scenario: Zones stack below the wide-layout threshold
- **GIVEN** the viewport is narrower than roughly 900px and at least 380px wide
- **WHEN** the topology is rendered or the viewport is resized
- **THEN** the three zones appear in a vertical sequence, nodes remain visible without horizontal overflow, and edges are routed against the stacked node positions

#### Scenario: Cross-zone edges remain connected after stacking
- **GIVEN** an edge connects nodes in different zones
- **WHEN** the zones are stacked vertically
- **THEN** the edge path starts and ends at the rendered source and destination nodes without relying on a CSS-only SVG overlay correction

#### Scenario: Inspector becomes a bottom sheet
- **GIVEN** the viewport is narrow and a visitor opens a node inspector
- **WHEN** the inspector appears
- **THEN** it is presented as a bottom sheet with readable content, usable controls, and access to the underlying page without requiring a desktop-width side panel

### Requirement: The topology has a generated non-visual description

The topology SVG SHALL expose an accessible role and name, and the page SHALL provide a text alternative that describes the rendered topology's nodes, zones, and connections. The text alternative SHALL be generated from the current `topology.json` data so that topology changes update the description without a separately maintained hand-written diagram summary.

#### Scenario: Assistive technology receives the diagram identity
- **GIVEN** a visitor navigates to the topology page with assistive technology
- **WHEN** the topology SVG is encountered
- **THEN** it exposes an appropriate diagram role and accessible name and the visitor can reach its generated text alternative

#### Scenario: Text alternative follows topology data
- **GIVEN** a node or connection is present in `topology.json`
- **WHEN** the topology is rendered
- **THEN** the generated text alternative includes that topology information and does not depend on a separately hand-written list

### Requirement: Quality styling remains accessible

Muted text SHALL meet the required contrast against the substrate, and keyboard-focus indicators SHALL remain visible and distinguishable against the topology canvas in every supported layout. The resulting page SHALL achieve a Lighthouse accessibility score of 100.

#### Scenario: Muted text remains readable
- **GIVEN** a visitor views muted labels or supporting text against the substrate
- **WHEN** the page is evaluated for contrast
- **THEN** the text meets the applicable accessibility contrast requirement

#### Scenario: Focus remains visible across layouts
- **GIVEN** a keyboard user focuses an interactive control in either the wide or stacked layout
- **WHEN** focus moves to that control
- **THEN** a visible focus ring distinguishes the control from the canvas and remains visible at the 380px viewport width

#### Scenario: Lighthouse reaches the quality floor
- **GIVEN** the production page is loaded at its deployed base path
- **WHEN** Lighthouse accessibility auditing is run
- **THEN** the accessibility score is 100 with no failed accessibility audits
