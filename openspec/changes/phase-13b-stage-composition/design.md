# Design — phase-13b-stage-composition

## Problem

Measured at 1440×900, contributions to the SVG's vertical offset: masthead padding 128px top and 128px bottom, `h1` at up to 5.5rem over two lines ≈172px, `--space-16` plus standfirst ≈130px, `--space-8` plus readout ≈53px, then the scenario rail's `--text-2xl` heading and buttons ≈200px, then `--space-24` stage margin 96px. The diagram begins around 900px, in an 820px content viewport.

## Direction

**Instrument above, field guide below.** The upper third is a working panel — masthead, topology, and the controls that operate it, visible together. Below it the page becomes a document, where phase-12's editorial treatment is right and stays untouched.

## Why a control column rather than a wider stage

Three defects share one cause: the rail sits above the stage, the legend below it, the detail panel on top of it. All three are chrome competing with the diagram for vertical space. A right-hand column at ≥1024px solves all three at once — the stage recovers roughly 300px of vertical, the legend becomes adjacent to what it explains, and detail gets a home that does not occlude.

Rejected: shrinking the overlay inspector. The occlusion is the defect, not the size.

## Focus on open

Removing `aria-modal` without revising `closeInspectorButton.focus()` would produce a non-modal region that steals focus every time a node is activated, including by mouse. Focus now stays on the invoking node. This is why the change depends on `phase-13a` — the focus-return contract has to exist first, or dismissal has nowhere defined to send focus.

## Snap behaviour

`scroll-snap-type: x proximity`, not `mandatory`. Mandatory snapping can prevent a keyboard-focused entry from being scrolled fully into view even with `scroll-margin-inline` set, which would reintroduce an accessibility defect while fixing a layout one.

## Stacked layout

Pitch 44 against `NODE_HEIGHT` 36 leaves an 8px gutter between node boxes. Boxes not overlapping is not the same as labels not colliding, so acceptance is measured on label bounding boxes with a 6px clearance floor. `NODE_HEIGHT` is not reduced: 36px meets WCAG 2.5.8 AA for touch targets and reducing it would put that at risk to buy vertical space the pitch change already provides.

## Risks

- **Two-column at 1024px could crowd the stage.** The width arithmetic is written into the spec so it can be rechecked rather than trusted, and a documented fallback exists. If shell padding or gap is changed during implementation, the arithmetic must be recomputed before the change is accepted.
- **The error state requires restructuring the data import.** `load.ts` throws at module scope, so a static import aborts before render code runs. Moving it behind a dynamic `import()` is a real change to startup order and could affect first-paint timing. Mitigated by requiring the loading skeleton in the same change.
- **Deleting `.canvas-dimmer` removes a click-outside dismissal surface.** Escape and the close control remain, both covered by `phase-13a` scenarios.

## Rollback

Reverting restores the stacked arrangement and the overlay inspector together. `phase-13c` depends on `.control-column` existing, so reverting after 13c has shipped requires reverting 13c first.
