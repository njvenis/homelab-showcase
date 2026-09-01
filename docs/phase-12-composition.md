# phase-12 — Composition

v2 fixed the colour. This fixes the shape. Three faults, in order of how much they cost:

1. **No type scale.** Fifteen ad hoc sizes, eight of them clustered between 0.62 and 0.95rem, so most of the page is one undifferentiated texture. Section headings at 1.35rem have no authority.
2. **One measure for everything.** Every section is 1400px wide with identical padding, so prose sits at 62ch inside a box more than twice that, and the page reads as a stack of equal blocks divided by hairlines.
3. **One moment of scale.** The hero is big; nothing else is. Two thousand pixels of scroll at a single volume.

No new colour, no new motion. This is scale, measure and rhythm only.

---

## Tokens

Replace every ad hoc size and margin. **Nothing outside this block may set a raw `font-size`, `margin` or `padding` value** — that rule is what stops the fifteen sizes growing back.

```css
:root {
  /* Type — 7 steps with real jumps. The gap between them is the point. */
  --text-xs:    0.75rem;    /* mono readouts only */
  --text-sm:    0.875rem;   /* secondary, captions, legend */
  --text-base:  1.0625rem;  /* body — slightly above 16px reads as considered */
  --text-lg:    1.375rem;   /* standfirst, flow-row lead */
  --text-xl:    2rem;       /* subsection, inspector title */
  --text-2xl:   3rem;       /* section headings — currently 1.35rem */
  --text-hero:  clamp(3.5rem, 8vw, 5.5rem);

  /* Space — one scale, used everywhere */
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;
  --space-32: 8rem;   /* between major sections */

  /* Measure — three widths, chosen per content type */
  --measure-prose: 34rem;    /* ~64ch, for anything read as sentences */
  --measure-wide:  75rem;    /* controls, legend, flow rows */
  --measure-stage: 92rem;    /* diagram only — it should exceed everything */
}
```

The section-heading jump from 1.35rem to 3rem is the single largest visual change in this list. Fraunces at 3rem with `font-weight: 460` and `letter-spacing: -0.02em` gives "Flows" and "Decisions" the presence they currently lack entirely.

---

## Measure

Stop centring everything in one container. Three widths, assigned by what the content is:

| Content | Width | Alignment |
|---|---|---|
| Diagram stage | `--measure-stage` | centred, widest thing on the page |
| Scenario rail, legend, flow rows | `--measure-wide` | centred |
| Hero standfirst, decision bodies, flow-row text | `--measure-prose` | **left-aligned within its column, not centred** |

That last row is the fix. Prose currently spans a 62ch `max-width` inside a 1400px centred container, which leaves symmetric dead space and makes the column look accidental. Put prose in an explicit narrow column that starts at the same left edge as everything else, and let the right-hand space be deliberate.

The diagram being wider than the text is what tells a visitor which is the subject.

---

## Editorial two-column

The scenario rail already does this — a narrow label column and a wide content column. Nothing else follows it, so it reads as a one-off rather than a system. Apply it to Flows and Decisions:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                [ diagram — widest ]                  │
│                                                      │
│   scenario rail                                      │
├──────────────────────────────────────────────────────┤
│  Flows              │  Morning briefing              │
│  3rem Fraunces      │  prose at --measure-prose      │
│  sticky while the   │  ▸ play                        │
│  section scrolls    │                                │
│                     │  Task from Discord             │
│                     │  ...                           │
├──────────────────────────────────────────────────────┤
│  Decisions          │  One model resident            │
│                     │  prose                         │
└──────────────────────────────────────────────────────┘
```

Heading left in a `minmax(9rem, 1fr)` column, content right in `minmax(0, 3fr)`. Below 900px it collapses to one column with the heading above, which is what the rail already does.

The section heading gets `position: sticky; top: var(--space-8)` so it holds while its content scrolls past. One quiet piece of behaviour that does more for perceived polish than any amount of decoration, and it costs two lines.

---

## Rhythm

- **`--space-32` between major sections.** Currently they are jammed together, which is a large part of why the page reads as a single undifferentiated column.
- **Delete the `border-bottom: 1px solid var(--rule)` section dividers.** Hairline rules between equal blocks is the broadsheet default. With `--space-32` between sections, space separates them and the rules become noise.
- **Keep exactly one rule on the page**: under the hero, where it genuinely marks the transition from title to instrument.
- **Flow rows keep their accent bar** — that is structural, not decoration; it encodes the scenario's flow hue.

---

## Hero

Currently: title, standfirst, readout, straight into controls. Give it room.

- Title at `--text-hero`, `max-width: 16ch`, `line-height: 0.98`
- `--space-16` between title and standfirst, standfirst at `--text-lg`
- `--space-8` to the readout line, which stays mono and lowercase
- `--space-24` before the stage

Padding above the title goes to `--space-32`. Space above a headline is what makes it read as deliberate rather than as the top of a document.

---

## Prompt

```
/opsx-propose phase-12-composition
```

```
Read docs/phase-12-composition.md.

This change fixes scale, measure and rhythm. It adds no colour, no motion, and
no new components — every element on the page already exists.

Scope, in order:

1. TOKENS. Add the type, space and measure scales exactly as specified. Then
   replace every font-size, margin and padding in style.css with a token. There
   are currently 15 distinct font sizes and roughly a dozen ad hoc margins; when
   this step is done there must be zero raw length values outside the token
   block except border widths and the SVG's own geometry.

2. MEASURE. Apply the three widths per the table. Prose moves into an explicit
   --measure-prose column, left-aligned, rather than a max-width inside a
   1400px centred container. The diagram stage becomes the widest element on
   the page at --measure-stage.

3. TWO-COLUMN. Apply the scenario rail's narrow-label / wide-content grid to
   the Flows and Decisions sections. Section headings go to --text-2xl Fraunces
   at weight 460, letter-spacing -0.02em, and become position: sticky with top:
   var(--space-8). Collapses to one column below 900px exactly as the rail does.

4. RHYTHM. --space-32 between major sections. Delete all section-divider
   border-bottom rules except the one under the hero. Flow-row accent bars stay.

5. HERO. Title at --text-hero, max-width 16ch, line-height 0.98, --space-32
   above it. --space-16 to the standfirst at --text-lg, --space-8 to the
   readout, --space-24 before the stage.

Constraints: no changes to src/packet.ts, src/scenario.ts, or any data file.
No new colour tokens. The lit treatment, tour, pulses and progress bars are
unchanged.

Then verify:
- grep -nE '[0-9]+(\.[0-9]+)?(rem|px|em)' src/style.css | grep -v ':root' and
  report every remaining raw length with its line and whether it is a border
  width or a leak.
- Confirm Lighthouse accessibility is still 100 — the larger type should help
  contrast, not hurt it, but the sticky headings are a new focus-order risk.
- Screenshot the page at 380, 900 and 1440 and describe what changed at each.

Stop after the artefacts.
```

---

## What this deliberately does not do

No hover transforms on the flow rows, no entrance animations on the sections, no cards. The page already has one bold move — the lit diagram — and composition work should make that read louder by being quieter around it. If something here reads as decorative rather than structural when you look at the result, cut it rather than tuning it.
