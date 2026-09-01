## Why

This implements runbook Step 7's packet animation primitive so scenario hops can make the topology legible without duplicating edge geometry or coupling concurrent packets. The edge must visibly carry its flow while a packet travels, while reduced-motion users receive the same flow-duration feedback without forced movement.

## What Changes

- Add a packet animation primitive that positions one packet on an edge's own SVG path using CSS `offset-path` from that path's `d` attribute.
- Expose a typed primitive contract, `animatePacket(edgePath: SVGPathElement, edge: Edge, hop: Hop): Promise<void>`, for one edge/hop lifecycle.
- Animate a packet from the hop's `from` anchor to its `to` anchor for the declared duration, including reverse hops on the same path.
- Track edge activity independently per packet so concurrent packets preserve one another's animation and defer the edge's fade-back until the final packet leaves.
- Highlight an active edge with its flow-kind colour and fade it back to `var(--rule)` over approximately 600ms after activity ends.
- Respect `prefers-reduced-motion` by omitting packet travel while retaining the edge highlight for the hop duration.
- Keep animation timing deterministic and driven by scenario data; do not add live telemetry or a backend.

## Capabilities

### New Capabilities

- `packet-animation`: Animate individual scenario packets along routed edge paths and manage per-edge highlighting, concurrency, reverse travel, and reduced-motion behavior.

### Modified Capabilities

None.

## Impact

- Adds the packet animation and edge-activity behavior to the direct SVG DOM rendering layer.
- Consumes existing typed topology edge paths and scenario hop durations/reverse flags; no change to the JSON source of truth is required.
- Uses browser-native CSS offset-path, offset-distance, Web Animations API, and media-query APIs only; no new dependency or backend is introduced.
- A reviewer should be able to trigger a scenario and see packets follow the exact rendered edge paths, observe flow-colour highlighting and fade-back, test overlapping packets, and verify reduced-motion behavior.
