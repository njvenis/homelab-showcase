## Context

The site has validated scenario JSON, rendered SVG edge paths, and the Step 7 packet primitive. The scenario data carries ordered hops with `at`, `duration`, and optional `reverse` values, plus one plain-language caption per scenario. The engine must provide the lifecycle that the later interaction rail can consume without duplicating scenario content. See proposal.md for motivation and `specs/scenario-engine/spec.md` for the behavior contract.

## Goals / Non-Goals

**Goals:**

- Schedule every validated hop from one run start time using its declared offset.
- Preserve independent packet lifecycles for overlapping hops and support cancellation of all work owned by one run.
- Expose a small playback lifecycle for play, stop, reset, and caption/state subscription.
- Make replay behavior deterministic and testable with controlled timers.
- Reuse the Step 7 packet primitive and existing rendered edge map rather than duplicating path or animation logic.

**Non-Goals:**

- Editing scenario JSON, inventing per-hop captions, or adding live telemetry.
- Routing packets, calculating graph layout, or changing packet easing, edge colours, or reduced-motion behavior.
- Adding persistence, URL state, autoplay policy handling, or a general event bus.
- Adding a dependency or a second scenario source.

## Decisions

- **Use one scheduled timeout per hop.** On `play`, create a run token and schedule each hop with its declared `at` offset relative to that run. At fire time, invoke the packet primitive and retain its cancellation handle until completion. Independent timers are preferred over a single sorted loop because equal or overlapping offsets naturally fire together and do not require artificial serialization.
- **Own all run resources in one lifecycle record.** The active run holds its timeout ids, packet handles, completion state, and scenario id. `stop` invalidates the run token before clearing timers and cancelling handles, so callbacks from the old run become no-ops even if the browser has already queued them. Starting another scenario first stops the previous run.
- **Use the packet primitive's cancellation-capable entry point.** The engine supplies each hop's edge identity, flow kind, duration, and reverse flag to the existing Step 7 primitive and retains the returned handle. It does not create packet elements or manipulate edge activity itself. Reset uses the packet module's cleanup/reset surface, if needed, to cancel pending edge fades and restore idle styles immediately; this preserves one owner for packet and edge state.
- **Publish a small immutable state snapshot.** Subscribers receive the active scenario id (or null), running status, current caption (or null), and hop progress events/state. The engine derives this state from JSON ids and lifecycle events; it does not copy scenario names, captions, or hop schedules into code.
- **Use declared data for all timing.** No `Math.random()`, wall-clock-derived offsets, random identifiers, or adaptive duration changes are permitted. A monotonically increasing local run sequence can identify runs for stale-callback guards without affecting timing or output.
- **Keep caption semantics aligned with the data model.** Because each scenario has one caption rather than per-hop caption fields, publishing the scenario caption at play and through progress events communicates the active flow without inventing content. Completion, stop, and reset publish the idle/null caption as specified.
- **Do not add a dependency.** Native `setTimeout`/`clearTimeout`, promises, the existing packet primitive, and the site's small subscription pattern are sufficient. Fake timers or a scheduler seam may be used by tests without becoming a runtime dependency.
- **Treat reduced motion as a packet concern.** The engine continues to schedule and cancel hops identically when reduced motion is active; the Step 7 primitive suppresses travel while retaining timed edge feedback. This avoids divergent scenario timing and keeps accessibility behavior centralized.

## Risks / Trade-offs

- **[Risk]** Browser timers fire late under load → **Mitigation:** schedule against each declared offset from the same start, avoid cumulative delays, and verify relative ordering and overlap with controlled timers; visual timing remains best-effort at the browser scheduler's resolution.
- **[Risk]** A stopped run's queued callback starts a packet after stop → **Mitigation:** invalidate the run token before clearing resources and check it at every timer callback.
- **[Risk]** Packet cancellation leaves a fade animation or edge style behind → **Mitigation:** centralize cleanup in the packet module and have reset explicitly cancel/clear packet-owned edge activity before publishing idle state.
- **[Risk]** A new scenario starts while the previous one is finishing → **Mitigation:** stop the prior run first, make completion idempotent, and publish state only for the current run token.
- **[Risk]** A future scenario adds malformed timing despite data validation → **Mitigation:** rely on the existing loader validation and reject non-finite/negative offsets or durations at the engine boundary with an actionable error rather than scheduling them.

## Migration Plan

Add the scenario engine beside the existing data loader and packet module, connect it to the rendered edge map and the page's caption/playback surface, then verify every scenario's offset order, overlap, replay, stop, reset, and caption lifecycle. No data migration or dependency installation is required. Rollback is limited to removing the engine and its page wiring; the validated JSON and Step 7 packet primitive remain independently usable.

The runbook checkpoint is the Step 8 acceptance: play a scenario twice and confirm identical timing, stop mid-run and confirm no orphaned packets or stuck highlights, verify the Discord scenario shows four concurrent packets, and confirm `grep -r 'Math.random' src/` returns nothing.
