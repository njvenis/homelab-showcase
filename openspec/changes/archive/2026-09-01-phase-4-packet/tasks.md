## 1. Packet Primitive

- [x] 1.1 Add the typed `animatePacket(edgePath: SVGPathElement, edge: Edge, hop: Hop): Promise<void>` entry point and create one packet lifecycle from the supplied edge path and hop; verify a direct browser console call resolves after the declared duration and uses the rendered path
- [x] 1.2 Derive CSS `offset-path` from the supplied SVG path's `d` attribute and animate `offset-distance` in the forward or reverse direction; verify normal and `reverse: true` calls reach the correct anchors without a second route
- [x] 1.3 Add per-edge activity tracking, flow-kind colour highlighting, cancellable fade-back to `var(--rule)`, and idempotent packet cleanup; verify a single hop highlights the edge and begins an approximately 600ms fade only after departure

## 2. Accessibility and Integration

- [x] 2.1 Add the `prefers-reduced-motion` branch and native media-query handling without adding a dependency; verify reduced-motion calls keep the packet stationary, hold the edge highlight for the hop duration, and then fade back normally
- [x] 2.2 Exercise overlapping calls on one edge and expose the primitive through the existing direct SVG rendering surface; verify each packet keeps its own timing/direction and the first completion cannot start the shared edge fade while another packet is active

## 3. Step Checkpoint

- [x] 3.1 Complete the runbook Step 7 checkpoint: run the project validation/build checks, trigger one packet from the console, verify two concurrent packets do not glitch, and test the raw-`d` `offset-path` behavior in Safari before committing the phase checkpoint
