# Design — phase-13c-flow-focus

## Focus rather than simplification

The brief requires legibility without dishonesty. Dimming non-participating edges during playback and non-incident edges during selection achieves it without removing anything: the full graph is always rendered, and emphasis is transient and reader-chosen. Both sets are derivable from existing data — `hops[].edge` for scenarios, `edges[].from/to` for selection — so this adds presentation state, not data.

Rejected: collapsing zones, hiding low-degree nodes, grouping by kind. Twenty-one nodes is the substance of the page.

## Why edges get a wrapper and nodes do not

Edges render as two flat sibling paths — `path.edge-glow` and `path.edge` — that `packet.ts` mutates by selector, setting `style.stroke` with reference-counted fade-back. Putting an opacity transition on those same elements would place two systems on one element with no defined composition, so edges get `g.edge-group` and dimming applies there.

Nodes already have exactly such a wrapper: `g.node-control`, carrying `data-node-id`, `role="button"` and the label. Adding a second would produce two elements with the same `data-node-id`, breaking the `nodeControls` map at `src/main.ts` ~244 and the arrival-pulse lookup at ~602. Node dimming targets the existing element.

Packets are appended to the SVG root (`packet.ts:149`), not into edge groups, so they are structurally outside the dimming. That is the desired behaviour — a moving packet stays bright — and it is stated so an implementer does not "fix" it by moving packets into groups.

## Two dim values

`--dim-inactive-edge: 0.35` and `--dim-inactive-node: 0.55`. Node groups contain label text; 0.35 would take it below the contrast floor. Labels are additionally exempted from group opacity, so the contrast obligation is a measurement rather than a judgement call.

## The path readout is a score, not a feed

An earlier draft specified a running hop trace — newest-first, capped, mono — which is the visual grammar of a live event stream and the exact impression this page must avoid. The readout instead shows the whole ordered script in advance and marks the current step as it plays. Rows always show the edge's declared `from → to` with a separate reverse indicator, so a row identifies an edge rather than a direction of travel and cannot be mistaken for a log line.

No `aria-describedby` from the scenario entry: pointing a description at a region containing every hop row would make a screen reader announce the whole path as the entry's name.

## Zone emphasis as data

`ext` should read as context rather than a third host. The cheap version is an `id === 'ext'` check in the renderer, which adds to the coupling the audit already identified. The optional `emphasis` field is additive, defaulted and validated, so existing data renders identically without it.

## Deferred deliberately

**Bloom derivation.** Edge-kind counts tie at rank 2 (infer 4, network 4), so "the two most frequent kinds" is non-deterministic. Not worth a tie-break rule for a background gradient.

**Computed zone rectangles.** Replacing hardcoded rects with computed geometry is a refactor of working layout for extensibility nothing here needs, and a regression inside a design change would be unattributable. The validator guard makes the coupling detectable now; the refactor belongs in its own change.

## Risks

- **Focus set changes on selection, scenario start and scenario stop** — not per hop — so 42 simultaneous opacity transitions occur only at those moments. If profiling shows jank, the mitigation is reducing transition duration, not removing the wrapper.
- **Adding `emphasis` touches the data model.** Optional, defaulted, validated in both the loader and `npm run validate`; rollback is deleting the field and one renderer branch.
- **Precedence between focus states is the subtlest behaviour here.** Three scenarios cover it, including the requirement that hop timings are unaffected by selection.

## Rollback

Revert restores uniform edge weight and the literal legend. `phase-13b` does not depend on this change, so it can be reverted alone.
