# premium-experience Specification

## Purpose

Refines the existing lit topology into a controllable, legible technical instrument. The page remains static, synthetic, dependency-free, and driven by the existing topology/scenario JSON.

**Depends on:** the verified and archived `phase-10-design-language` change and the existing interaction/stage-composition keyboard contracts.

**Architectural constraints:** no new dependency or framework; no topology coordinates in JSON; no live telemetry; no random animation/layout; one scenario engine and one packet lifecycle; decorative SVG glow paths remain `aria-hidden` and pointer-transparent.

## Requirements

### Requirement: Hero and topology establish hierarchy

The page SHALL render the hero headline larger than section headings, retain the standfirst and machine readout, and keep the topology near the first viewport.

#### Scenario: Desktop hierarchy and fold

- **GIVEN** a fonts-ready page at 1440×900 with no focus indicator
- **THEN** the hero headline's computed font size is greater than each section heading's computed font size
- **AND** the topology SVG top is no more than 340px from the document top

#### Scenario: Tablet fold

- **GIVEN** a fonts-ready page at 1024×768
- **THEN** the topology SVG top is no more than 300px from the document top

### Requirement: Flow kinds have colour and non-colour meaning

Each of the six `FlowKind` values SHALL retain its existing semantic hue and expose a deterministic secondary cue through line grammar or hover/selected-context text. Secondary cues SHALL NOT imply edge direction.

#### Scenario: All kinds are explainable

- **GIVEN** the topology is idle and the display is viewed in colour or grayscale
- **THEN** the legend names all six flow kinds and their meanings
- **AND** each kind has a documented non-colour or text cue

#### Scenario: Edge context exposes text

- **GIVEN** a visitor hovers an edge or selects an edge-equivalent node/path context
- **THEN** the connected endpoint labels and flow kind are available as text
- **AND** edges do not become independent keyboard focus stops; the existing roving node model remains the only topology focus model
- **AND** decorative glow paths create no additional semantic or focus element

### Requirement: Automatic playback is bounded and controllable

The automatic invitation SHALL run at most one pass in scenario data order after the existing 2500ms delay. A native Stop playback control SHALL cancel active work and explicit Replay SHALL be required to start another automatic pass. Reduced motion SHALL suppress the automatic invitation.

#### Scenario: One invitation pass

- **GIVEN** a loaded page with scenarios and reduced motion disabled
- **WHEN** 2500ms elapses without user interaction
- **THEN** the first scenario starts
- **AND** each scenario is played in `scenarios.json` order at most once
- **AND** no second pass starts without explicit Replay

#### Scenario: Stop clears playback

- **GIVEN** any scenario is running
- **WHEN** Stop playback is activated
- **THEN** the existing scenario engine stop path runs
- **AND** packets, edge activity, pulses, progress, and tour timers are cleared
- **AND** manual scenario controls remain enabled

#### Scenario: Reduced motion suppresses invitation

- **GIVEN** `prefers-reduced-motion: reduce`
- **WHEN** the page loads or the preference becomes active
- **THEN** no automatic invitation starts
- **AND** manual controls remain usable with discrete progress and no travelling packet

### Requirement: Playback state is shared and text-readable

Rail and Flows controls for one scenario SHALL share running, stopped, progress, caption, and accessible-name state. Progress and step state SHALL be derived from `ScenarioState` and hop data.

#### Scenario: Duplicate controls stay synchronized

- **GIVEN** a scenario has both a rail button and a Flows-row button
- **WHEN** either control starts or stops playback
- **THEN** both controls expose the same running/stopped state and progress
- **AND** the caption and current step identify the same scenario

#### Scenario: Announcements are bounded

- **GIVEN** `discord-task` runs to completion
- **WHEN** the scenario live region is observed
- **THEN** it announces start and completion only
- **AND** it does not announce individual packet arrivals or every progress frame

### Requirement: Detail preserves topology and focus

Selecting a node SHALL keep the SVG topology present and readable. The detail SHALL be a named non-modal region, and dismissal SHALL return focus to the invoking node.

#### Scenario: Desktop detail does not occlude

- **GIVEN** a node is selected at 1440px or 1024px
- **THEN** the topology remains present
- **AND** the detail and SVG bounding rectangles do not intersect
- **AND** the detail is not a modal dialog and does not require a focus trap

#### Scenario: Keyboard focus returns

- **GIVEN** a visitor opens node `swap` with Enter
- **WHEN** Close or Escape dismisses detail
- **THEN** focus returns to the `swap` node
- **AND** exactly one node retains the roving `tabindex="0"`

#### Scenario: Long phone detail remains reachable

- **GIVEN** a long-detail node is selected at 390px
- **THEN** the detail is scrollable within a surface no taller than 60vh
- **AND** Close is reachable
- **AND** the invoking node and stage context remain available

### Requirement: Responsive layouts are discoverable and overflow-free

The page SHALL provide intentional compositions at 1440px, 1024px, 768px, and 390px, with no document-level horizontal overflow at the required boundary widths.

#### Scenario: Boundary widths

- **GIVEN** viewport widths 320, 390, 640, 768, 900, 1024, 1280, 1440, and 1920
- **THEN** `document.documentElement.scrollWidth` equals `document.documentElement.clientWidth`
- **AND** every scenario control remains discoverable and keyboard-operable

#### Scenario: Mobile scenario controls

- **GIVEN** a 390px or 768px viewport
- **THEN** all five scenario choices are visible in a wrapping grid or have an explicit, accessible overflow cue
- **AND** no choice depends on an unexplained horizontal gesture alone

### Requirement: States and accessibility remain complete

Loading, empty, error, hover, focus, selected, running, disabled, and reduced-motion states SHALL have usable text/semantic behavior, and the existing accessibility floor SHALL not regress.

#### Scenario: Error and empty states

- **GIVEN** data loading fails or the scenario array is empty
- **THEN** the page exposes the existing accessible alert or empty message
- **AND** it does not expose misleading active playback controls

#### Scenario: Accessibility audit

- **GIVEN** the built site at 390px and 1440px
- **WHEN** Lighthouse accessibility and axe checks run
- **THEN** Lighthouse accessibility remains 100
- **AND** no critical or serious axe violation is introduced

#### Scenario: Reduced motion remains comprehensible

- **GIVEN** reduced motion is enabled
- **THEN** no automatic tour, travelling packet, transform transition, or continuous progress animation is present
- **AND** captions, step text, focus indicators, manual controls, and discrete arrival feedback remain usable
