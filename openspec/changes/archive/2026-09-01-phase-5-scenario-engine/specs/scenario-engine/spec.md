## Purpose

Coordinates the JSON-defined homelab scenarios into deterministic, replayable playback so each hop drives the existing packet primitive and the page communicates the flow through its caption.

## ADDED Requirements

### Requirement: Scenario playback uses declared hop offsets

The scenario engine SHALL load a named scenario from the validated scenario data and invoke the Step 7 packet primitive for each hop at that hop's `at` offset measured from playback start. A hop's declared duration and reverse direction SHALL be passed through unchanged. When reduced motion is enabled, packet travel SHALL follow the packet primitive's reduced-motion behavior while hop scheduling and caption timing remain unchanged.

#### Scenario: Hop fires at its scenario offset

- **GIVEN** a valid scenario contains a hop with an `at` offset and duration
- **WHEN** the scenario is played
- **THEN** the packet primitive is invoked for that hop at the declared offset from scenario start with its declared duration and direction
- **AND** reduced motion suppresses packet travel without changing the declared offset or duration

### Requirement: Overlapping hops run concurrently

The scenario engine SHALL schedule each hop independently so hops whose active intervals overlap can run at the same time. It SHALL support at least the four simultaneous packets required by the Discord scenario without delaying, replacing, or cancelling earlier overlapping hops. Reduced motion SHALL keep overlapping hop timing and independent completion while the packet primitive keeps packets stationary.

#### Scenario: Discord fan-out has four packets in flight

- **GIVEN** the Discord scenario reaches its four overlapping subagent hops
- **WHEN** the four hop offsets have elapsed
- **THEN** four independent packet lifecycles are active concurrently and each completes according to its own duration
- **AND** reduced motion preserves the four independent timed lifecycles without packet travel

### Requirement: Scenario replay is deterministic

Playing the same scenario from an idle state twice SHALL use the same hop order, offsets, durations, directions, caption transitions, and packet calls. The scenario engine SHALL NOT use `Math.random()` or any other random value to determine playback behavior.

#### Scenario: Replaying a scenario produces identical timing

- **GIVEN** a scenario is played to completion and then played again from an idle state
- **WHEN** both runs are observed or recorded
- **THEN** their hop and caption event timelines are identical
- **AND** no random value is used to vary either run

### Requirement: Stop cancels the active run

The scenario engine SHALL provide a stop operation that cancels every scheduled but not-yet-fired hop and every in-flight packet belonging to the active run. Stopping SHALL prevent later callbacks from the stopped run and SHALL settle all edge activity through the packet primitive's normal cleanup behavior.

#### Scenario: Stop mid-run leaves no active packets

- **GIVEN** a scenario has scheduled hops and at least one packet is in flight
- **WHEN** stop is requested before the scenario completes
- **THEN** all pending hop schedules and in-flight packet lifecycles are cancelled, no stopped-run hop starts afterward, and all affected edges settle to their idle state
- **AND** reduced motion cancels pending timers and active timed hop lifecycles with the same cleanup result

### Requirement: Reset restores an idle diagram

The scenario engine SHALL provide a reset operation that stops the active run, clears playback state and caption content, and leaves no packet, pending schedule, active edge highlight, or stale scenario progress in the diagram.

#### Scenario: Reset removes playback residue

- **GIVEN** a scenario is idle, playing, or stopped with packets or highlights recently active
- **WHEN** reset is requested
- **THEN** the diagram returns to its idle state with no packets, pending callbacks, active edge highlights, or scenario caption residue

### Requirement: Captions follow scenario playback

The scenario engine SHALL publish the active scenario's caption when playback begins, keep it associated with that running scenario while its hops progress, replace it when another scenario starts, and clear it when playback is stopped, completed, or reset.

#### Scenario: Caption updates during playback

- **GIVEN** a named scenario has a caption in the scenario data
- **WHEN** playback starts and advances through its hops
- **THEN** the page receives the selected scenario's caption as the current playback caption until the run ends or another scenario replaces it

#### Scenario: Stopping clears the caption

- **GIVEN** a scenario caption is currently displayed
- **WHEN** playback is stopped or reset
- **THEN** the published caption is cleared and the idle state contains no stale scenario caption
