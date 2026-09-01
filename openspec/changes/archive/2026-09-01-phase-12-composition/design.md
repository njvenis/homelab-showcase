## Context

The page is built from three layers, all of which this change only restyles:

- `index.html` owns the static hero (`.page-header`: `h1`, standfirst `<p>`, `#hero-readout`), the static Decisions section (three `.decision` articles under `.decisions__heading`), and the footer.
- `src/main.ts` renders everything interactive into `main#app`: the scenario rail (`.scenario-rail`), the topology stage with inline-SVG (`#topology-stage`), the inspector, the caption, the flow legend, and the Flows section (`renderFlowsSection` produces `<section class="flows">` with a `<h2>` and one `.flow-row` per scenario).
- `src/style.css` carries every length, colour token, and animation. `src/layout.ts` chooses wide vs. stacked topology based on live stage width; `src/packet.ts` and `src/scenario.ts` drive motion and timing and are outside this boundary.

`docs/phase-12-composition.md` is the brief (tokens, measure, two-column editorials, rhythm, hero). It fixes scale, measure, and rhythm only — no colour, no new motion, no new components. See proposal.md for motivation and `openspec/specs/` for the observable contract once created.

No dependency is added. No `Math.random()` is involved in any animation path: packets travel fixed `offset-path` routes, the stacked channel lane is chosen from a hash of endpoint coordinates (`layout.ts`), and the tour/pulse timers use wall-clock `performance.now()`/WAAPI — no random source anywhere.

## Goals / Non-Goals

**Goals:**

- Add the exact type, space, and measure custom-property scales from the brief to `:root`, and retire the three stale text tokens (`--text-body`, `--text-subhead`, `--text-display`).
- Replace every non-token `font-size`, `margin`, and `padding` in `src/style.css` with a token, following the replacement algorithm in Decisions §2; leaving only the permitted leaks (border/stroke widths, clip rects, letter-spacing, glow/blur radii, SVG-driven sizes) as surfaced in the raw-length audit.
- Apply the three measures per the brief's table: `--measure-stage` widest for the diagram, `--measure-wide` for the rail/controls/legend/flow rows, `--measure-prose` for prose — left-aligned in its own column.
- Convert Flows and Decisions to the scenario rail's `minmax(9rem, 1fr) / minmax(0, 3fr)` two-column grid, with `--text-2xl` Fraunces headings at weight 460 / `letter-spacing: -0.02em` made `position: sticky; top: var(--space-8)`, collapsing to one column below 900px.
- Establish `--space-32` between major sections; delete every section-border rule except the single underline beneath the hero; keep flow-row accent bars.
- Apply the hero scale/width/line-height/spacing: `--text-hero`, `max-width: 16ch`, `line-height: 0.98`, `--space-32` above title, `--space-16` to the standfirst at `--text-lg`, `--space-8` to the readout, `--space-24` before the stage; add a narrow-width fallback so the clamp does not balloon the title.
- Preserve all colour tokens, animation and interaction behaviour, SVG rendering, scenario/data, and the excluded files (`src/packet.ts`, `src/scenario.ts`, and data files). Verify the raw-length audit, Lighthouse accessibility at 100, and screenshots at 380/900/1440.

**Non-Goals:**

- No changes to colour tokens, the lit bloom/glow treatment, the idle tour, arrival pulses, progress bars, packet routes, scenario timing, captions, the inspector, or the SVG.
- No new components, hover transforms, entrance animations, cards, or decorative borders.
- No API, backend, framework, localization, or dependency change. No new custom property beyond the three prescribed scales.
- No rewrite of `index.html` semantics or `main.ts` structure solely for styling; DOM shape changes only where the two-column grid cannot be achieved in pure CSS.

## Decisions

### 1. Adopt the three prescribed scales verbatim; retire the stale text tokens

Add the brief's `:root` block exactly — `--text-xs/sm/base/lg/xl/2xl/hero`, `--space-1/2/3/4/6/8/12/16/24/32`, `--measure-prose/wide/stage` — in place of the existing `--text-body/--text-subhead/--text-display` definitions. Do not extend the scale with extra steps for convenience (see §2 for the few values with no slot).

The largest single change is the section-heading jump from `1.35rem` to `--text-2xl` (`3rem`) at `font-weight: 460`, `letter-spacing: -0.02em` — this is the hierarchy fix the brief calls out; it reads as authority rather than decoration.

```
selector / element              current                     new token
---------------------------------------------------------------
body                            var(--text-body)=1rem       var(--text-base)=1.0625
.page-header h1 (hero title)    clamp(..,6vw,var(--display))  var(--text-hero)
.page-header p (standfirst)     var(--text-subhead)=1.25    var(--text-lg)=1.375
#hero-readout                   0.85rem mono                var(--text-sm)=0.875
.scenario-rail__intro h2        1.35rem                     var(--text-2xl)=3
.flow-legend__heading h2        1.35rem                     var(--text-2xl)=3
.decisions__heading             1.35rem                     var(--text-2xl)=3 (+sticky)
.flows h2                       1.35rem                     var(--text-2xl)=3 (+sticky)
.decision__title                1.35rem                     var(--text-lg)=1.375
.flow-row__title                var(--text-subhead)=1.25    var(--text-lg)=1.375
.inspector h2                   clamp(1.7,4vw,2.25)         var(--text-xl)=2
.inspector__facts dd            0.88rem                     var(--text-sm)=0.875
.inspector__detail              0.95rem                     var(--text-sm)=0.875
.scenario-button__name          0.82rem                     var(--text-sm)=0.875
.site-footer__line              0.9rem                      var(--text-sm)=0.875
.flow-row__text                 var(--text-body)=1rem       var(--text-base)=1.0625
.decision__body                 var(--text-body)=1rem       var(--text-base)=1.0625
.html font-size                 16px                        removed (root inherits default)
```

Alternative rejected: introducing a generic length token namespace (e.g. `--size-*`) to cover every orphan value. It adds surface area the brief forbids and turns the tidy 22-token prescription into an open-ended palette; the coarse scale is intentional and the gaps are handled in §2.

### 2. Trace and replace lengths with a scan-replace-verify loop, not a rewrite

Replace lengths by property, not by eye, using this sequence:

1. **Scan.** Record every candidate with `grep -nE '\b(margin|padding|font-size|gap|top|right|bottom|left|inset|width|min-width|max-width)\s*:' src/style.css`.
2. **Replace.** Substitute `rem`/`px`/`em` literals with the token that matches exactly. For `clamp()` gutters, keep viewport units (`vw`) intact and tokenize only the absolute constants, e.g. `clamp(2.5rem, 7vw, 6rem)` → `clamp(var(--space-12), 7vw, var(--space-24))`.
3. **Round to nearest when no token matches**, tolerating ≤ 0.15 rem for layout gutters/paddings, and record the rounded value.
4. **Verify.** Re-run the brief's audit and reconcile every hit against the accepted-exception list below.

Accepted exceptions (retained raw lengths, each listed in the audit with its line and why):

- Border / rule / outline widths and `outline-offset`, `stroke-width`, `stroke-dasharray`: `1px`, `1.5`, `3`, `4`, `6 4`.
- `.sr-only` clip geometry (`margin:-1px`, `rect(0,0,0,0)`): accessibility helper, not visual.
- `letter-spacing` / `word-spacing` (`em`): typographic kerning, orthogonal to the length scale.
- `.inspector` shadow spread (`0 1rem 3rem`) and `.legend-swatch`/`.packet` glow blur (`10px`, `3px`): the first is migrated to `var(--space-4)`/`var(--space-16)`; the glow/blur radii belong to the preserved lit treatment and have no scale step.
- Flow-row accent bar `width: 3px` and node accent hairline: structural SVG-derived strokes kept intentionally by the brief.
- `--scenario-button__status` (`0.62rem`) and SVG text sizes driven in `main.ts` (`.zone-label`/`.zone-sub`): sub-caption micro type / app-rendered glyphs with no matching token; the former is called out, the latter lives in markup strings, not the stylesheet.

Alternative rejected: hand-copying values from memory while editing selectors. Property-scanning guarantees no orphan length survives unexamined and makes the audit reproducible.

### 3. Assign measures per content type; let the stage break past the 1400px shell

Replace every `min(100%, 1400px)` / `max-width: 1400px` centre wrapper with its content-measure token:

- Controls, rail, legend, flow rows → `--measure-wide` (`75rem`), centred.
- Prose blocks (standfirst, decision bodies, flow-row text, footer line) → `--measure-prose` (`34rem`, ≈64ch), **`text-align: start`** with no centre margin, so the column hugs one edge and the right-hand space is deliberate.
- Topology stage → `--measure-stage` (`92rem`), centred, the widest element on the page.

The stage currently nests inside `.interaction-shell` (capped at 1400px), so it cannot exceed the shell in normal flow. Resolve by promoting the centring container to the widest measure and self-constraining the narrower groups: set the shell/host width to `min(100%, var(--measure-stage))` for a shared centre axis, then constrain rail/controls/legend to `--measure-wide` (their own `max-width` + `margin-inline: auto`) instead of inheriting the shell cap. This makes the diagram wider than the prose without widening the prose columns.

Because `selectLayout` picks wide vs. stacked layout from the live stage width (threshold `STAGE_STACK_THRESHOLD = 900`), widening the stage changes recomputation: keep the `ResizeObserver` on `#topology-stage` and the `refreshTopology` call path intact, and re-check at 1440 (wide, stage ~92rem) and just under 900px stage width (stacks). Do not bake a new layout function; the existing `selectLayout(stageWidth)` reacts automatically.

Alternative rejected: moving the stage out of `.interaction-shell` into the document flow. It breaks the single centre axis the rail/legend/flows share and forces a structural refactor for a cosmetic width gain.

### 4. Implement Flows and Decisions as two-column grids in pure CSS

Apply the rail's `grid-template-columns: minmax(9rem, 1fr) minmax(0, 3fr)` to `.flows` and `.decisions`. The `<h2>` becomes the sticky label column; the row/article children fill the content column:

```css
.flows, .decisions {
  display: grid;
  grid-template-columns: minmax(9rem, 1fr) minmax(0, 3fr);
}
.flows h2, .decisions__heading {
  grid-column: 1;
  position: sticky;
  top: var(--space-8);
  font: { family Fraunces; size var(--text-2xl); weight 460; letter-spacing -0.02em; }
}
.flow-row, .decision { grid-column: 2; }
```

Auto-placement then stacks the rows/articles in column 2 starting beside the heading, which sits pinned at the left. Content blocks inside keep `max-width: var(--measure-prose)`. Collapse below 900px to `grid-template-columns: 1fr` (matching the rail's existing `@media (max-width: 900px)` handling), heading on top.

DOM-order caveat (flagged, not opened): the heading is the first DOM child, so confirm the grid does not push a flow row above it; if placement reads oddly, wrap the rows/articles in a single `display:block` content column (a one-line addition in `renderFlowsSection`) rather than fighting `order`. Prefer the pure-CSS form first.

Alternative rejected: a JS-driven resize branch or reflow helper. Native grid + media queries provide the collapse with no script and keep the direct-DOM model phase-11 established.

### 5. Rhythm through spacing, not dividers

Set `--space-32` between major sections (hero → shell, shell → Flows, Flows → Decisions, Decisions → footer) via section padding/margin. Delete every `border-bottom: 1px solid var(--rule)` section divider — `.scenario-rail` currently carries one (`lines 127-134`) that separates equal blocks — and keep exactly one rule: the underline already under the hero (`.page-header`). Flow-row accent bars (`.flow-row::before`) stay; they are structural hue encoding, not decoration.

Before deleting, inspect each section's current padding so neighbours sit at even `--space-32`; the brief warns jammed sections read as one column — even vertical rhythm replaces the rules, so tune padding to remove visual seams before assuming a divider was doing work.

Alternative rejected: retaining thin rules and only widening gaps. Hairlines between equal blocks are exactly the broadsheet-default look the brief rejects.

### 6. Expand the hero treatment, with a narrow-width fallback

Apply to `.page-header`:

- `h1`: `var(--text-hero)`, `max-width: 16ch`, `line-height: 0.98`; top padding `--space-32`; keep `text-wrap: balance`.
- Standfirst: `var(--text-lg)`, `--space-16` above `h1`, `--measure-prose`, left-aligned.
- `#hero-readout`: mono/lowercase kept, `var(--text-sm)`, `--space-8` above standfirst.
- Stage separation: `--space-24` before `#topology-stage` (via shell bottom padding / stage margin-top).

`--text-hero = clamp(3.5rem, 8vw, 5.5rem)` floors at `3.5rem` once `8vw` drops below `3.5rem` (≈700px viewport), which balloons the title at 380–700px. Add a `@media (max-width: 640px)` fallback that swaps the clamp for a flatter `clamp(2.4rem, 12vw, 3rem)` and tightens `max-width` (e.g. `14ch`), mirroring the existing 640px override being retired. Drop the old literal `2.44140625rem`/`1rem` 640px overrides — they were patching this very gap and become redundant once hero sizes come from tokens.

Alternative rejected: leaving the clamp's `3.5rem` floor and skipping the narrow breakpoint. It leaves the headline overflowing at phone widths, the most common failure screen in the screenshot matrix.

### 7. Preserve behaviour and the integrity boundary; state it once

Motion and state are untouched: the idle tour (`INITIAL_DELAY_MS`/`REST_MS`), arrival pulses (WAAPI in `emitArrivalPulse`), smooth progress RAF, reduced-motion branching, and packet routing all remain identical — this change is CSS and markup restyling only, so `src/packet.ts`, `src/scenario.ts`, and all data files are never edited. Verification runs the existing test/build pipeline and the existing keyboard/reduced-motion interaction paths to prove nothing behavioural moved. No dependency is introduced at any point.

## Risks / Trade-offs

- **[Risk]** Orphan sizes grow back (the fifteen ad-hoc sizes the brief diagnoses). → **Mitigation:** the scan→replace→verify loop plus the committed accepted-exception list keep the audit authoritative; any new raw length must justify inclusion.
- **[Risk]** Prose measure looks accidental (left-aligned inside a 1400px centred box). → **Mitigation:** explicit `--measure-prose` column with `text-align: start` and no centre margin, so every prose block shares one left edge.
- **[Risk]** Widening the stage past the 1400px shell causes horizontal overflow or a stale wide-vs-staged layout. → **Mitigation:** keep the shared centre axis and self-constrain narrower groups; rely on the existing `ResizeObserver`/`selectLayout(stageWidth)` to recompute; check at 1440 and just under 900px stage width.
- **[Risk]** Two-column grid mis-orders the heading above its rows. → **Mitigation:** pure-CSS auto-placement tested at 1440/900; fall back to a one-line rows wrapper in `renderFlowsSection` only if placement reads wrong.
- **[Risk]** Sticky headings overlap scrolling content or jump on paint. → **Mitigation:** `top: var(--space-8)` pins without trapping focus (headings are non-interactive), so focus order is unaffected; visually confirm content clears the pinned head.
- **[Risk]** Removing dividers reveals uneven section rhythm. → **Mitigation:** establish even `--space-32` before deleting rules and re-check that neighbours no longer appear to lean.
- **[Risk]** `--text-hero` clamp inflates the title at phone widths. → **Mitigation:** 640px flat-clamp fallback; screenshot at 380px confirms fit.
- **[Risk]** Larger type degrades Lighthouse contrast or a11y score. → **Mitigation:** headings keep `var(--ink)`; body bump to `--text-base` improves contrast, not harms it; run the full Lighthouse accessibility sweep and confirm no landmark/label/loss-of-focus regressions.
- **[Risk]** Styling changes slip into excluded files (`packet.ts`/`scenario.ts`/data). → **Mitigation:** boundary stated explicitly; verification diffs prove those files are untouched.

## Migration Plan

1. Add the prescribed `:root` token block to `src/style.css` and delete the three stale text tokens.
2. Run the §2 scan on `src/style.css`; replace `font-size`/`margin`/`padding`/`gap` literals with tokens (tokenize clamp constants, keep `vw`), rounding within 0.15 rem and recording each case; delete the retired 640px literal overrides.
3. Apply measures (§3): swap 1400px centre wrappers for the three measure tokens, widen the stage axis to `--measure-stage`, and constrain rail/controls/legend to `--measure-wide`.
4. Implement the two-column grids for `.flows` and `.decisions` (§4), sticky headings, and the 900px collapse.
5. Apply rhythm (§5): `--space-32` between sections, delete section dividers except under the hero, keep flow-row accent bars.
6. Apply the hero treatment (§6) including the 640px narrow fallback.
7. Verify: `npm run validate` and `npm run build` pass; re-run `grep -nE '[0-9]+(\.[0-9]+)?(rem|px|em)' src/style.css | grep -v ':root'` and reconcile every hit against the accepted-exception list; run Lighthouse accessibility and confirm 100; take screenshots at 380/900/1440px describing the hero, two-column, and layout transitions; tab both control sets and exercise reduced motion.
8. Roll back by reverting the phase commit; the original 1400px-centre, divider, and ad-hoc-size page remains the fallback.