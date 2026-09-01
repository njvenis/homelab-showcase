## Context

The site renders a fixed topology as direct SVG DOM, with edge geometry already available as rendered SVG paths and scenario hops supplying durations and reverse direction. The existing data model distinguishes an edge's `bidirectional` rendering fact from a hop's `reverse` travel fact. See proposal.md for motivation and `specs/packet-animation/spec.md` for the behavior contract.

## Goals / Non-Goals

**Goals:**

- Make one packet animation instance consume one edge path, so rendered geometry remains the only route source.
- Keep packet lifecycle state separate from shared edge activity state, including overlapping packets and cancelled animations.
- Use native CSS offset-path/offset-distance and the Web Animations API with deterministic duration and direction.
- Make reduced-motion a first-class branch that preserves temporal edge feedback without moving the packet.
- Add no dependency; the browser platform APIs already selected by the runbook are sufficient.

**Non-Goals:**

- Scenario sequencing, captions, or fan-out orchestration; those consume this primitive later.
- Dynamic graph layout, path routing, live telemetry, or persistent animation state.
- A general-purpose animation framework or support for packet paths spanning multiple edges.

## Decisions

- **Use the rendered SVG path's `d` as the packet offset path.** The primitive receives the edge path element and derives the CSS `offset-path` from that element's path data. The packet element then animates `offset-distance` from `0%` to `100%`; reverse hops use `100%` to `0%`. This keeps packets on the exact cubic Bézier route users see. A second SVG path or coordinate interpolation was rejected because it duplicates geometry and can drift from the edge.
- **Use one native animation per packet.** Each invocation owns its packet element and Web Animations API animation, with its own duration, direction, and completion cleanup. Shared edge state is not stored on the packet animation object. A global timeline or one edge-wide animation was rejected because overlapping hops would overwrite timing and direction.
- **Keep the primitive contract minimal and typed.** Export `animatePacket(edgePath: SVGPathElement, edge: Edge, hop: Hop): Promise<void>`. The caller supplies the already-rendered path and validated data; the promise represents completion of that one packet lifecycle. A broad options/config object was rejected because the current capability has no caller-controlled variants beyond edge, hop, and the browser's motion preference.
- **Use an edge activity counter/set plus a cancellable fade.** Entering a packet increments activity and cancels any pending fade; leaving decrements activity. Only the transition to zero active packets starts the approximately 600ms return to `var(--rule)`. Cleanup is idempotent so finish, cancel, and reduced-motion completion cannot decrement twice. A boolean-only flag was rejected because the first of two packets could incorrectly make the edge idle.
- **Represent flow colour through the existing CSS custom-property palette.** Edge highlighting selects the configured flow-kind colour while active and returns to `var(--rule)` through the existing edge style/transition mechanism. No new colour literals or per-flow animation constants are introduced.
- **Branch on `prefers-reduced-motion` before creating travel motion.** In reduced motion, the packet is placed at a stable endpoint/neutral position and the edge activity lease is held for the hop duration before normal cleanup. The edge timing remains observable, but no offset-distance animation is created. This is preferred over merely shortening motion because it guarantees no travel while preserving scenario timing.
- **Use browser-native media-query observation.** Read the media query when a hop starts and use the browser's native change event for future hops; an in-progress hop keeps its selected mode for deterministic cleanup. No dependency is added.
- **Keep animation paths deterministic.** Durations and direction come only from validated scenario data; packet identity is generated from the hop invocation/lifecycle, not `Math.random()`, and no random coordinates or timing are used.

## Risks / Trade-offs

- **[Risk]** CSS `path()` syntax or unusual path data may be rejected by a browser → **Mitigation:** use the existing path element as the source, validate the derived offset-path during development, and fail the individual packet cleanly without mutating shared edge activity.
- **[Risk]** A new packet can arrive while an edge is fading → **Mitigation:** cancel and replace the fade whenever activity rises above zero; only the zero-activity transition can schedule a new fade.
- **[Risk]** Animation cancellation can leave stale DOM or activity state → **Mitigation:** centralize idempotent finalization for finish, cancel, and reduced-motion timeout paths, and remove the packet element during finalization.
- **[Risk]** A changed OS motion preference during a running hop has ambiguous timing → **Mitigation:** sample the preference at hop start and apply the change to subsequent hops, avoiding mid-flight direction or cleanup changes.

## Migration Plan

Add the primitive beside the existing SVG rendering code, connect it to the scenario playback path, and verify normal, reverse, overlapping, and reduced-motion hops against the acceptance scenarios. No data migration or dependency installation is required. Rollback is limited to removing the primitive and its playback wiring; topology and scenario JSON remain unchanged.

The runbook checkpoint is the packet primitive acceptance: run the project's checks, manually trigger at least one normal and reverse hop, overlap two packets on an edge, and repeat with reduced motion before committing the phase checkpoint.

## Open Questions

None.
