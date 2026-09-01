# Design audit — homelab-showcase @ 157da44

Inspected: `index.html`, `src/main.ts` (771), `src/style.css` (884), `src/layout.ts` (216), `src/scenario.ts` (216), `src/packet.ts` (219), `src/data/*.json`, `docs/v2-lit.md`, `README.md`, `openspec/`.

Topology: 3 zones, 21 nodes (pi 9, wsl 8, ext 4), 21 edges. Scenarios: 5, hop counts 2–17, durations 800–8350ms.

---

## 1. What the experience is trying to communicate

That a self-hosted control plane is a *system with traffic in it* — models, memory, automation, observability, remote access and one external dependency — and that its shape reflects deliberate constraints rather than accident. The five scenarios are the argument: each is a real path, and the model-swap scenario in particular exists to make a constraint (one resident model) visible rather than described.

Correctly, it does not claim to be live. Flows are scripted, the readout carries stable facts rather than metrics, and nothing implies uptime or health status.

## 2. Strongest existing decisions

- **Colour is semantic and enforced.** Six flow kinds, six hues, `--edge-idle-*` derived by `color-mix` rather than hand-picked. Hue means one thing everywhere.
- **The data-driven pipeline is real.** `topology.json` → `load.ts` → validator → render. Direction is modelled honestly as two separable concerns (`bidirectional` on edges for rendering, `reverse` on hops for animation), and the loader rejects a hop that sets `reverse` on a one-way edge.
- **`transitional: true` on `cowork`.** The one hosted dependency is flagged in data and rendered dashed. Most showcases would have quietly omitted it.
- **The reduced-motion path is a genuine alternative presentation**, not a disable switch.
- **The SVG text alternative is generated from topology**, so it cannot drift from the diagram.
- **`vector-effect: non-scaling-stroke`** on focus rings, so they survive the stacked layout's viewBox change.

## 3. The five biggest weaknesses

**W1 — The topology is below the fold.** Phase-12's hero uses `--space-32` (8rem) padding top *and* bottom, `--text-hero` up to 5.5rem, `--space-16` to the standfirst and `--space-8` to the readout; then `.topology-stage` adds `--space-24` (6rem) on top of a scenario rail whose heading is `--text-2xl` (3rem). Measured at 1440×900, the SVG's top edge lands roughly 900px down the document. The subject of the page is not visible on arrival. This is a regression introduced by composition work that was otherwise correct.

**W2 — Inspecting a node hides it.** `.inspector` is `position: absolute` at the stage's top-right with `role="dialog" aria-modal="true"`, over a `.canvas-dimmer` at 72% substrate. Selecting a node therefore dims the diagram and covers roughly a fifth of it — including, depending on position, the node just selected. A field guide should put the explanation *beside* the thing.

**W3 — The scenario rail hides what the scenarios are.** Five equal buttons in a `repeat(5, 1fr)` grid, distinguished only by name. `health-sweep` is 2 hops over 800ms; `discord-task` is 17 hops over 6430ms. Clicking the first feels like a broken button, because it finishes before the eye reaches the stage. Nothing communicates weight, duration, or which scenario is representative.

**W4 — Zone hierarchy is flat.** `pi`, `wsl` and `ext` receive identical surface, border and label treatment, despite `ext` being *outside the house* and holding four third-party endpoints. The page's most interesting claim — nothing is exposed publicly — is undermined by rendering the outside world as a peer of the two hosts.

**W5 — The legend is detached from what it explains.** `.flow-legend` renders after the stage and caption as its own section titled "Flow key", six entries in a `repeat(6, 1fr)` grid. The reader must look away from the diagram, down, and back. Adjacency would cost nothing.

## 4. Visual hierarchy

The page currently reads: enormous title → medium controls → diagram → small caption → medium legend → sections. The subject sits fourth.

It should read: compact masthead → **diagram, with its controls and key adjacent** → reading material. Specifically:

- Masthead compresses to roughly a third of its current height; the title steps down from `--text-hero` to `--text-2xl`. The hero's job is to name the thing, not to perform.
- Stage and control column become a two-column composition at ≥1024px, so scenarios, legend and inspector sit beside the diagram instead of stacking above and below it.
- Section headings keep `--text-2xl` — they earn it below the fold, where the page becomes a document.
- The scenario caption is currently `--text-sm` muted, which is the smallest treatment on the page for the text that explains what is happening. It should be `--text-base` at full ink.

## 5. Topology legibility without losing technical honesty

Three additions, all derived from existing data:

- **Scenario focus.** While a scenario runs, edges not in its hop list drop to ~35% opacity. Participating edges keep full treatment. This is derivable from `hops[].edge` — no new data, no simplification of the diagram, nothing hidden permanently.
- **Selection focus.** Selecting a node raises its incident edges and dims the rest. The honest version of "make it simpler": the full graph is always present, and the reader chooses what to foreground.
- **Zone emphasis.** `ext` renders as context (dashed boundary, reduced fill, muted label) rather than as a peer host. This is a truer diagram, not a simplified one.

What must *not* happen: collapsing nodes, hiding edges permanently, or grouping unrelated nodes for tidiness. The node count is the point.

## 6. Purposeful, premium playback

- **Metadata on each scenario**: hop count and duration, in mono, derived from the data. Turns five identical buttons into five characterised paths.
- **A hop trace** in the control column while running — the current hop's edge label appearing in sequence — so playback is readable rather than merely watchable.
- **Scenario focus dimming** (above) makes the run feel authored rather than ambient.
- **The caption becomes primary text**, not a muted footnote.
- The existing 1200ms dead pause in `model-swap` is the best moment on the page and currently goes unremarked. The caption should name it while it happens.

## 7. Mobile

The stacked layout uses `STACK_ROW_PITCH 64`, `STACK_HEADER 56`, `STACK_ZONE_GAP 28`. For 9/8/4 nodes that computes to a viewBox roughly **1676px tall at 390px wide** — the diagram alone is over four viewport heights, rendered 1:1 because the stacked viewBox tracks stage width.

- Compress pitch and header so the stacked diagram fits in ≤1200px.
- Controls become a horizontally scrollable rail above the stage, not a 5-up grid crushed to one column.
- The inspector becomes a bottom sheet rather than an absolutely-positioned card at `min(22rem, 100% - 2.5rem)`.
- The hero at 390px still spends 8rem of padding before a 3.5rem title. Halve it.

## 8. Accessibility

**A1 — The arrival live region is the most serious defect on the page.** `#scenario-arrival` is `aria-live="polite"` and receives `textContent` on every packet arrival. `discord-task` fires 17 arrivals in 6.4 seconds; the idle tour then loops all five scenarios indefinitely. A screen reader user gets continuous, unstoppable announcement from page load. This needs to become one announcement at scenario start and one summary at completion.

**A2 — `role="dialog" aria-modal="true"` combined with `aria-live="polite"`** on `.inspector` is contradictory: a modal is not a live region. Once the inspector stops being an overlay, both attributes should go and it becomes a labelled region.

**A3 — `#hero-readout` carries `role="status" aria-live="polite"`** for content written once at load, producing a spurious announcement of static facts.

**A4 — Sticky section headings** introduced in phase-12 are a scroll-and-focus risk not currently covered by a test.

**A5 — Contrast** of `--ink-muted` (#93A5B5) on `--surface` (#1B2530) should be re-measured at `--text-xs`, which the readout drops to at ≤380px.

## 9. Risks to the data-driven architecture

- **`wideLayout` hardcodes zone rectangles by id** (`pi`, `wsl`, `ext`). Adding a fourth zone to `topology.json` renders it at `undefined` coordinates. The validator does not catch this, because it validates data against data, not data against layout.
- **The stage bloom hardcodes `control` + `infer`** with a comment instructing manual update if kind counts change. A derived value would not drift.
- **Legend entries are a literal array in `main.ts`**, not derived from the kinds present in `topology.json`. Six kinds are currently in both places; nothing enforces that.

All three are the same failure mode: presentation constants that duplicate facts already in data. Any change that adds structure should reduce this coupling, not add to it.
