## Context

The static Vite page currently owns the hero in `index.html` and renders the interactive shell, scenario rail, caption, legend, SVG topology, and inspector from `src/main.ts`. Topology and scenarios are validated JSON data, while the scenario store already exposes the single playback state used by the rail. The v2 layout in `docs/v2-lit.md` adds prose structure around that centrepiece; it does not call for a second rendering or a new UI framework.

See proposal.md for motivation and `specs/site-structure/spec.md` for the observable contract.

## Goals / Non-Goals

**Goals:**

- Put the readout in the existing hero, with topology-derived node count and a minimal authored readout data file for values topology cannot supply.
- Add data-driven Flows rows for all five scenarios while keeping the current rail and scenario store as the only playback engine.
- Make the row state a projection of the same active scenario/progress state that drives the rail, including keyboard and reduced-motion behavior.
- Add quiet prose sections and the exact minimal footer without introducing a card system, decorative motion, or new dependencies.
- Preserve the existing SVG/stage and inspector DOM semantics while allowing a new control to scroll the stage into view.

**Non-Goals:**

- No changes to topology layout, edge rendering, packet animation, scenario timing, captions, inspector behavior, or the existing rail's visual language.
- No live telemetry, backend, CMS, localization layer, content-management abstraction, or new dependency.
- No separate state machine, duplicate scenario scheduler, duplicated progress loop, or independent Flows playback implementation.
- No inter-row borders, cards, stat tiles, big-number metrics, section entrance animations, or decorative footer content.

## Decisions

### Keep the hero shell in `index.html`; keep dynamic values in `main.ts`

The existing static header is already the hero boundary, so add the readout directly after its standfirst rather than moving the page header into the application renderer. Derive `topology.nodes.length` from the loaded topology and load a typed `readout.json` object for `residentModels`, `briefingTime`, and `qwenThroughput`; this keeps machine content in data and avoids pretending the authored values are live telemetry. A simple explicit shape is preferable to a generic metric registry because there is one fixed instrument line and no requested extensibility.

Alternative rejected: four independently rendered metric components or cards. They would add structure the direction explicitly rejects and would give a dashboard reading to a single status line.

### Render scenario descriptions from a small presentation mapping

Keep `scenarios.json` as the source of animation captions and add the two-sentence Flows prose in a small data-driven presentation mapping keyed by scenario id, or a narrowly typed field in the existing scenario presentation data if one already exists. The implementation must validate that all five scenario ids have descriptions and must render descriptions as text, not HTML, so the captions remain unchanged and content cannot accidentally become markup.

Alternative rejected: rewriting the existing captions in place. Captions are part of the current rail/stage behavior and changing them would violate the preservation boundary; the Flows copy is a separate reading context.

### Determine row hue from referenced edge kinds

Build a `Map` of edge id to edge kind from the loaded topology and count the kinds of each scenario's referenced hops, including repeated hops because repetition reflects the scenario's dominant flow. Resolve ties using the established stable kind order used by the legend. Emit one row-level custom property such as `--scenario-flow` and let CSS map it to the existing `--flow-*` token; do not add colour literals or a scenario-specific palette.

Alternative rejected: hand-picking five colours in CSS. That would duplicate topology meaning and drift when scenario data changes.

### Register rail and Flows controls together, but render state once

Give each control the existing scenario id data attribute and maintain a single collection of all scenario controls, or a shared control-binding helper, so click handlers call the same `play(id)` path. Extend the existing state render pass to update rail buttons and Flows rows from `getState()`; the row can receive the same running marker and progress custom property while its button carries the accessible name/status. The active row's play control should use a native `<button>` and the row should not become a second interactive target.

On activation, scroll the existing `#topology-stage` with native `scrollIntoView`; choose `behavior: 'auto'` under reduced motion and the existing smooth behavior otherwise, then invoke the shared `play(id)`. This ordering makes the stage visible before playback begins without changing packet timing or scenario state.

Alternative rejected: dispatching a click to the rail button. It would couple the new section to rail DOM structure and can make event/state synchronization opaque; both controls should call the same engine entry point instead.

### Use native document structure and CSS layout for responsive behavior

Add semantic `<section>` elements with `aria-labelledby` headings and a `<footer>`. Keep rows as a grid/flex arrangement with the accent as a pseudo-element or a dedicated non-semantic element, and use spacing (`gap`, margins, and section padding) rather than borders. The readout is an inline, wrapping text element with `overflow-wrap: anywhere` only as a last-resort guard; normal spaces around the middle dots should be the primary wrap opportunities. At 380px, reduce gaps and let the row control occupy a predictable narrow column or wrap below the prose without horizontal overflow.

Alternative rejected: a layout library or JS resize branching. CSS media queries provide the native responsive behavior with no dependency and preserve the direct DOM approach.

### Write decisions and footer as static, accessible prose

Use three explicit decision blocks in `index.html` or the static render shell, with headings such as “One model resident”, “Memory off the inference box”, and “Nothing exposed publicly”. The planned copy remains close to inspector language: factual, concrete, and about constraints rather than product claims. The footer uses one repository link with an accessible label and the exact requested sentence; no extra navigation is inferred from the presence of a source link.

## Risks / Trade-offs

- **[Risk]** Two control sets can drift in visual or ARIA state. → **Mitigation:** one state subscription/render pass updates every control and row from the existing scenario state; test start, replacement, stop, completion, and keyboard activation from both locations.
- **[Risk]** A scenario can reference a missing edge or have a tie in dominant kinds. → **Mitigation:** use validated loader data, fail validation for missing presentation references, and use a documented stable kind order for ties rather than arbitrary iteration or randomness.
- **[Risk]** Long mono values or row prose can overflow narrow screens. → **Mitigation:** test at 380px, permit natural readout wrapping, set minimum-width constraints to zero on flex/grid children, and keep the layout one-column at the narrow breakpoint.
- **[Risk]** Smooth scrolling can conflict with reduced-motion preference. → **Mitigation:** select instant native scrolling when the media query matches; the existing reduced-motion packet behavior remains untouched.
- **[Risk]** Adding structure around the stage accidentally changes the diagram's accessible tree or event delegation. → **Mitigation:** leave SVG rendering and inspector markup paths intact, bind new controls outside the stage, and run the existing validation/build plus keyboard and screen-reader checks.

## Migration Plan

1. Add the readout data contract and presentation copy, then render the hero readout and static Decisions/footer structure.
2. Add the Flows section and row styling, deriving row accents from validated scenario/topology data.
3. Bind Flows controls to the existing scenario engine, extend the existing state projection to mirror row/control running state, and add stage scrolling with reduced-motion handling.
4. Run `npm run validate` and `npm run build`; inspect the page at desktop and 380px, tab through both control sets, and verify the existing stage/inspector interactions.
5. Roll back by reverting the phase commit; the existing hero, rail, stage, caption, inspector, and legend remain the fallback experience.
