## Why

This implements runbook Step 8, Scenario engine. The five scripted flows are already represented as JSON, but the site needs a deterministic coordinator that turns their hop schedules into visible packets and captions; without it, the topology cannot demonstrate the stack's behavior or be replayed reliably.

## What Changes

- Add a scenario playback engine that reads validated scenarios from `src/data/scenarios.json`.
- Schedule each hop at its declared `at` offset from scenario start and invoke the Step 7 packet primitive for the referenced edge.
- Allow hops with overlapping offsets to run concurrently, including the Discord subagent fan-out.
- Add deterministic play, stop, and reset lifecycle operations with cancellation and cleanup of every in-flight packet and edge highlight.
- Publish caption updates as the selected scenario progresses through its scripted flow.
- Expose playback state to the page interaction layer without duplicating scenario content in code.
- Guarantee deterministic replay and prohibit `Math.random()` in the engine.

## Capabilities

### New Capabilities

- `scenario-engine`: Deterministically schedules JSON-defined scenario hops, coordinates packet lifecycles, updates captions, and cleans up playback state.

### Modified Capabilities

None.

## Impact

- Adds a small TypeScript scenario module alongside the existing direct SVG renderer and Step 7 packet primitive.
- Connects scenario playback state and caption updates to the page surface; the interaction rail can consume the lifecycle without owning scheduling.
- Uses existing validated topology/scenario data and rendered edge paths; no JSON schema, backend, or API change is required.
- Adds no dependency and no random or live timing source; declared scenario offsets and durations remain the source of playback timing.
- A reviewer should be able to play the five scenarios, observe simultaneous Discord fan-out packets, replay a scenario identically, stop and reset mid-run without residue, and see the caption follow the flow.
