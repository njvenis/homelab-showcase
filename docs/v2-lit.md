# v2 — Lit

Departure from the monochrome idle state. The organising idea: **the stack is switched on**. A patch panel at night is not grey — every link is lit, and traffic makes it brighter. Colour stops being something that visits the page and becomes its resting state, without giving up the rule that made v1 coherent: hue means flow kind, always.

What carries over untouched: Fraunces and the Plex family, the six flow hues, the diagram as the centrepiece, packets as the one bold move, motion answering meaning. What goes: the wireframe idle state, uniform hairline borders, and the all-caps tracked kickers (`.section-kicker`) — that treatment is generic template chrome and v1 already leans on it.

---

## Tokens

Additions and changes only; existing flow hues are unchanged.

```
--substrate     #121A22    unchanged
--surface       #1B2530    unchanged
--surface-2     #24303E    raised elements: inspector, hovered rows
--rule          #34424F    demoted: structural rules only, never decoration
--ink           #E4EAF0    unchanged
--ink-muted     #93A5B5    lifted slightly for contrast on surface-2
--flow-network  #93ACC4    sixth hue, the tailnet fabric

Derived per flow kind, not hand-picked:
--edge-idle-*   color-mix(in oklch, var(--flow-*) 30%, var(--rule))
--bloom-*       color-mix(in oklch, var(--flow-*) 14%, transparent)
```

Idle edges sit at `--edge-idle-*` with a 1px glow of the same hue at low alpha. Under traffic they rise to the full flow hue with the existing fade-back. The diagram is never grey again, and a screenshot now shows the semantic structure instead of hiding it.

## Type

Same two families, redistributed:

- **Display** — Fraunces, optical size high, weight 480–540. Hero up to 4.25rem. Also now carries section headings ("Flows", "Decisions") at 1.6rem, so the serif voice runs through the page instead of appearing once at the top.
- **Body** — IBM Plex Sans, unchanged.
- **Readout** — IBM Plex Mono, lowercase, only for machine values. The uppercase tracking goes. Mono text never labels a section; it states a value.

## Layout

```
┌────────────────────────────────────────────────────┐
│  A small stack, deliberately wired.        Fraunces │
│  standfirst, one sentence                            │
│  nodes 21 · resident models 1 · briefing 08:30 ·    │
│  qwen ~170 tok/s          ← mono readout line        │
├────────────────────────────────────────────────────┤
│                                                    │
│        [ diagram — permanently lit, tour runs ]     │
│        soft bloom behind the stage, one radial      │
│                                                    │
│  scenario rail + caption (as v1, restyled)          │
├────────────────────────────────────────────────────┤
│  Flows                                              │
│  five full-width rows: name — one short paragraph   │
│  — play. Accent bar in the scenario's dominant      │
│  flow hue. No cards, no borders between rows;       │
│  spacing and the accent bar do the separating.      │
├────────────────────────────────────────────────────┤
│  Decisions                                          │
│  three prose blocks drawn from DECISIONS.md:        │
│  one model resident · memory off the inference      │
│  box · nothing exposed publicly. Written as         │
│  reasoning, two or three sentences each.            │
├────────────────────────────────────────────────────┤
│  footer: source on GitHub · built with the stack    │
│  it describes                                       │
└────────────────────────────────────────────────────┘
```

Left-aligned throughout. The readout line replaces any temptation toward a stat-card grid — it is an instrument's status line, which is what this page is about.

## Principles

1. Hue always means flow kind. v2 changes where colour lives, never what it means.
2. The lit network is the signature. Everything added below the diagram is quiet prose — no cards, no per-section entrance animations, no decorative gradients.
3. Depth comes from light, not shadow: glows and blooms in the flow hues, one radial bloom behind the stage, `--surface-2` for raised elements. No grey drop-shadow kit.
4. If a background effect is visible at a glance rather than felt, it is too strong.

## Self-critique before building

Checked against the usual generated-page defaults: no acid accent on near-black (six working hues, none acidic); no card kit (the Flows section is deliberately rows, not cards); kickers removed rather than restyled; mono is semantic, lowercase, and never a label; the hero is the live diagram rather than a big number with a gradient. The remaining risk is the glow treatment drifting toward generic cyber-neon — the guard is that every glow inherits a working hue from the token system and stays under 30% mix at idle. Nothing glows decoratively.

---

## Changes

Two OpenSpec changes, in order. The earlier polish change is fully absorbed and should not be referenced: its idle tour, arrival pulses, network hue and progress bar are specified in full below, its gradient/dot-grid/vignette treatment is superseded by the stage bloom, and the `counter.ts` deletion rides along. `phase-9-polish-prompts.md` is dead — delete it rather than committing it, so nothing points at two sources for the same behaviour.

### phase-10-design-language

```
/opsx-propose phase-10-design-language
```

```
Read docs/runbook.md section 6 and this v2 direction in docs/v2-lit.md.

Propose the v2 design language change. Scope:

1. TOKENS. Add --surface-2, --flow-network, and the derived --edge-idle-* and
   --bloom-* values via color-mix in oklch. Lift --ink-muted to #93A5B5.
   No other hue changes.

2. LIT EDGES. Idle edges take their kind's --edge-idle-* colour with a faint
   same-hue glow (SVG filter or thin duplicate path at low alpha — pick one and
   justify it in the design doc; drop-shadow on 21 paths may cost frames).
   Under traffic an edge rises to its full flow hue, keeping the existing
   fade-back behaviour and reference counting. packet.ts must use
   --flow-network for the network kind — it currently aliases control.

3. NODE PRESENCE. Nodes keep the substrate fill but gain a kind-hue accent:
   3px left edge at 60%, and a faint fill tint at 6% of the kind hue. The
   transitional dash treatment is preserved on top.

4. STAGE BLOOM. One radial bloom behind the diagram, --bloom values of the two
   dominant hues in the topology, felt not seen. No dot grids, no vignettes.

5. IDLE TOUR. On load, after a 2500ms delay, scenarios auto-play in
   scenarios.json order with a 3000ms rest between them, looping indefinitely.
   Any user interaction — scenario button, node click, keypress, or a play
   control — stops the tour permanently for the session; it never resumes. The
   running scenario button shows the same running treatment during the tour as
   it does for manual play. Under prefers-reduced-motion the tour never starts.
   The page must arrive alive: the idle state is what every first-time visitor
   judges it by.

6. ARRIVAL PULSES. When a packet reaches the end of its hop, the destination
   node's border pulses once in the packet's flow colour — stroke changes to
   the flow hue and stroke-width eases 1.5 → 3 → 1.5 over 400ms, easing
   cubic-bezier(0.22, 1, 0.36, 1). Drive it from the existing packet lifecycle
   completion; do not add timers. Concurrent arrivals at one node restart the
   pulse rather than stacking. Under prefers-reduced-motion the pulse still
   fires — it is a discrete state change, not travel — as a stroke-colour step
   held for 400ms then faded, with no width animation.

7. RUNNING PROGRESS. The running scenario button carries a 2px progress bar on
   its bottom edge in --flow-control, scaled by elapsed time over the
   scenario's total duration. Total duration is derivable from the hop array
   (max of at + duration) — add no new state. It resets on stop and is the only
   progress indication the idle tour has. Under prefers-reduced-motion it steps
   per hop rather than animating continuously.

8. LEGEND. Six entries including network. Restyle swatches as small lit dashes
   (short line segments in the hue with its glow) instead of dots, so the
   legend previews the edges themselves.

9. KICKERS. Remove the uppercase tracked .section-kicker treatment entirely.
   Where a kicker carried real information, fold it into the heading; where it
   did not, delete it.

10. Delete src/counter.ts.

Specs must state as Given/When/Then: idle edge colour per kind, traffic
brightening and fade-back, tour stop conditions, reduced-motion behaviour for
tour and pulses, and that Lighthouse accessibility stays at 100 — the lit
treatment must not sink text contrast anywhere.

No new dependencies. Stop after the artefacts.
```

### phase-11-site-structure

```
/opsx-propose phase-11-site-structure
```

```
Read docs/v2-lit.md layout section.

Propose the site structure change. Scope:

1. HERO READOUT. Under the standfirst, one mono readout line, lowercase,
   values separated by spaced middle dots: nodes, resident models, briefing
   time, qwen throughput. Values come from topology.json where derivable
   (node count) and from a small src/data/readout.json where not. No stat
   cards, no big-number treatment.

2. FLOWS SECTION. Below the diagram: five full-width rows, one per scenario.
   Each row: scenario name in Fraunces, one short paragraph (write it from the
   scenario captions, expanded to two sentences of plain description), and a
   play control that scrolls the stage into view and plays that scenario.
   A 3px accent bar on the row's left edge in the scenario's dominant flow
   hue. Rows are separated by spacing alone — no borders, no cards. The row
   whose scenario is running shows the same running treatment as its rail
   button.

3. DECISIONS SECTION. Three prose blocks: one model resident at a time;
   memory lives off the inference box; nothing is exposed publicly. Two or
   three sentences each, written as engineering reasoning in the voice of the
   existing inspector copy. Fraunces heading, body text, no ornament.

4. FOOTER. One line: link to the GitHub repo, and the sentence "Built with the
   stack it describes." Nothing else.

5. The scenario rail, caption, inspector and stage behaviour are unchanged —
   this change adds structure around the diagram, it does not touch the
   diagram's internals.

Specs must state: play controls in the Flows section drive the same engine as
the rail with identical running/stopped state in both places; keyboard access
for the new controls; the readout line wraps cleanly at 380px.

No new dependencies. Stop after the artefacts.
```

### Sequence

1. Commit this file as `docs/v2-lit.md` so both proposals can read it.
2. `phase-10-design-language` — propose, review, apply, verify, archive.
3. Deploy and look at it lit before starting phase-11. The bloom strength and
   idle-edge mix percentages are eye judgements, tuned on the live page.
4. `phase-11-site-structure` — propose, review, apply, verify, archive.

### Verification prompt (after each apply)

```
Verify against the v2 direction:
1. Screenshot-describe the idle page after 5 seconds untouched. Every edge
   should carry its kind's hue; nothing should be grey except structural rules.
2. Play off-network-access: steel packets, steel pulses, six legend entries.
3. Toggle reduced motion: no tour, no travel, pulses as colour steps, page
   fully usable.
4. Lighthouse accessibility 100 — report any contrast failures the lit
   treatment introduced.
5. grep -rE '#[0-9a-fA-F]{3,6}' src/ — token block only.
6. Tab through the whole page including the new Flows controls.
Report each separately.
```
