# packet-animation Specification

## Purpose
Provides deterministic, data-driven packet motion and edge activity feedback for scripted topology scenarios, including accessible reduced-motion behavior and safe overlap of concurrent hops.

## Requirements

### Requirement: Packet primitive exposes a typed single-hop contract

The packet animation capability SHALL expose the typed operation `animatePacket(edgePath: SVGPathElement, edge: Edge, hop: Hop): Promise<void>`. The operation SHALL animate only the supplied edge and hop, and its returned promise SHALL settle when that packet lifecycle has completed, including the reduced-motion duration.

#### Scenario: One primitive call owns one packet lifecycle

- **GIVEN** a rendered SVG path, its typed edge, and a validated hop with a positive duration
- **WHEN** `animatePacket(edgePath, edge, hop)` is called
- **THEN** exactly one packet lifecycle is started for that edge and hop and the returned promise settles when the lifecycle ends
- **AND** when `prefers-reduced-motion` is enabled, the promise remains pending for the hop duration without moving the packet

### Requirement: Packets travel along the declared edge path

The system SHALL animate each packet along the rendered path belonging to the hop's edge, from the edge's `from` anchor to its `to` anchor, over the hop's declared duration. A packet SHALL remain associated with that single edge path for the duration of the hop rather than taking a separate straight-line route.

#### Scenario: Packet travels from from anchor to to anchor

- **GIVEN** a hop identifies an edge with a rendered path, a `from` anchor, a `to` anchor, and a positive duration
- **WHEN** the packet animation starts
- **THEN** the packet travels along that edge path from the `from` anchor to the `to` anchor and reaches the destination when the duration elapses
- **AND** when `prefers-reduced-motion` is enabled, the packet does not travel and the edge instead remains highlighted for the hop duration

### Requirement: Reverse hops use the same path in the opposite direction

The system SHALL honor `reverse: true` by traversing the referenced edge path from its `to` anchor to its `from` anchor without creating or selecting a second path.

#### Scenario: Reverse hop travels backward

- **GIVEN** a hop identifies a bidirectional edge and sets `reverse: true`
- **WHEN** the packet animation starts
- **THEN** the packet travels along the same rendered edge path from the `to` anchor to the `from` anchor over the hop's duration
- **AND** when `prefers-reduced-motion` is enabled, the packet does not travel and the edge instead remains highlighted for the hop duration

### Requirement: Active edges use flow colour and fade back when idle

While one or more packets are on an edge, the edge SHALL use the colour associated with its flow kind. After the last packet leaves, the edge SHALL fade back to `var(--rule)` over approximately 600 milliseconds.

#### Scenario: Edge highlights during a hop and fades after departure

- **GIVEN** a packet is traversing an edge whose flow kind has a configured colour
- **WHEN** the packet enters and later leaves the edge
- **THEN** the edge uses that flow-kind colour while the packet is active and fades back to `var(--rule)` over roughly 600 milliseconds after the last packet leaves
- **AND** when `prefers-reduced-motion` is enabled, the edge uses the same highlight and fade timing while the packet remains stationary for the hop duration

### Requirement: Concurrent packets keep edge activity independent

The system SHALL track each packet's lifecycle independently when multiple packets use the same edge. An earlier packet completing SHALL NOT cancel or reset another packet's travel, and the edge SHALL NOT begin its idle fade until no packet remains active on that edge.

#### Scenario: Overlapping packets do not corrupt travel or fade-back

- **GIVEN** two packets are active concurrently on the same edge, with different start times or durations
- **WHEN** the first packet leaves while the second packet remains active
- **THEN** both packet animations retain their own direction and timing, the edge remains in its flow-kind colour, and no fade-back starts
- **AND** when `prefers-reduced-motion` is enabled, both packets remain stationary for their respective hop durations and the edge fades only after the later duration ends

### Requirement: Reduced motion removes packet travel but preserves hop feedback

When the user agent reports `prefers-reduced-motion: reduce`, the system SHALL suppress packet movement while preserving an edge highlight for the complete hop duration, then SHALL apply the normal approximately 600 millisecond fade-back after the final active hop.

#### Scenario: Reduced-motion user sees a stationary packet and timed edge highlight

- **GIVEN** `prefers-reduced-motion: reduce` matches and a hop is started
- **WHEN** the hop duration elapses
- **THEN** the packet has not travelled along the path, the edge has been highlighted for the hop duration, and the edge begins fading back to `var(--rule)` only after the hop is no longer active
