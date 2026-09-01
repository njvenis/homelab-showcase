# composition Specification

## Purpose

Defines the page's deliberate type, spacing, and measure system together with its responsive editorial layout, section rhythm, and hero hierarchy for the existing single-page site, so the diagram reads as the subject, prose sits in an explicit narrow column, and the section order has a clear reading cadence — without adding colour, motion, or components. This change transforms fifteen ad hoc sizes, one uniform content measure, and divider-heavy spacing into a tokenized scale, assigned measures, and intentional space; every element on the page already exists and no animation is introduced. All colour stays via CSS custom properties and no new tokens are added.

## ADDED Requirements

### Requirement: Type, space, and measure scales are exposed as CSS custom properties in :root

The project SHALL define the type, space, and measure custom-property scales exactly as specified in `docs/phase-12-composition.md`, inside the `:root` block of `src/style.css`:

- Type (`--text-xs` 0.75rem, `--text-sm` 0.875rem, `--text-base` 1.0625rem, `--text-lg` 1.375rem, `--text-xl` 2rem, `--text-2xl` 3rem, `--text-hero` clamp(3.5rem, 8vw, 5.5rem));
- Space (`--space-1` 0.25rem, `--space-2` 0.5rem, `--space-3` 0.75rem, `--space-4` 1rem, `--space-6` 1.5rem, `--space-8` 2rem, `--space-12` 3rem, `--space-16` 4rem, `--space-24` 6rem, `--space-32` 8rem);
- Measure (`--measure-prose` 34rem, `--measure-wide` 75rem, `--measure-stage` 92rem).

Every one of these custom properties SHALL exist with the exact value above, and the type/space/measure blocks SHALL live within the same `:root` declaration as the existing colour tokens.

#### Scenario: Token scales are present with exact values

- **GIVEN** `src/style.css` contains the updated `:root` block after this change
- **WHEN** the stylesheet is inspected for the custom properties listed above
- **THEN** each of `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`, `--text-hero`, `--space-1` through `--space-32`, `--measure-prose`, `--measure-wide`, and `--measure-stage` is defined with the exact value specified
- **AND** none of them reference a raw length outside the `:root` block

#### Scenario: No new colour tokens are introduced

- **GIVEN** the color-token list in `:root` before this change
- **WHEN** the `:root` block is inspected after this change
- **THEN** all pre-existing colour tokens remain and no additional colour custom property is added by this change

### Requirement: No raw font-size, margin, or padding length exists outside :root except allowed widths

The project SHALL ensure that, after this change, no selector other than `:root` sets a raw `font-size`, `margin`, or `padding` value expressed in rem, px, or em. The only lengths permitted raw outside `:root` are border widths (including outline-width) and SVG geometry (stroke width and equivalent vector dimensions). Any remaining raw font-size, margin, or padding value elsewhere is a leak that this capability must not contain.

#### Scenario: Raw-length audit finds only allowed exceptions

- **GIVEN** the post-change stylesheet in `src/style.css`
- **WHEN** the raw-length command `grep -nE '[0-9]+(\.[0-9]+)?(rem|px|em)' src/style.css | grep -v ':root'` is run and every reported line is classified
- **THEN** no reported length is an unused `font-size`, `margin`, or `padding` leak
- **AND** every reported length is either a border width (e.g. the 1px rule or 3px focus outline) or SVG geometry
- **AND** every `font-size`, `margin`, and `padding` elsewhere resolves to a token defined in `:root`

### Requirement: Measures are assigned per content type with left-aligned prose

The three measures SHALL be applied by content type: the topology diagram stage renders at `--measure-stage` and becomes the widest element on the page; wide-content regions (the scenario rail, flow legend, and flow rows) render at `--measure-wide`; and anything read as sentences — the hero standfirst, decision bodies, and flow-row text — renders inside an explicit `--measure-prose` column. That prose column is left-aligned: it starts at the same left edge as the shared container and lets the right-hand space be deliberate rather than centring within a wide box.

#### Scenario: Prose column is left-aligned and stage is the widest element

- **GIVEN** the rendered page with the diagram and adjacent prose visible
- **WHEN** the horizontal boxes of the page are measured against each other
- **THEN** the diagram stage is wider than every other element and sits at `--measure-stage`
- **AND** the prose column matches `--measure-prose` and its left edge aligns with the shared container's left edge instead of sitting centred inside a wider box

#### Scenario: Wide content adopts --measure-wide

- **GIVEN** the scenario rail, flow legend, and flow rows on the page
- **WHEN** their containing column width is measured
- **THEN** each renders at `--measure-wide`

### Requirement: Flows and Decisions use an editorial two-column grid below 900px

The Flows and Decisions sections SHALL adopt the scenario rail's narrow-label / wide-content grid: a header column of `minmax(9rem, 1fr)` on the left and a content column of `minmax(0, 3fr)` on the right, so the section heading sits beside its prose rather than stacked above it. Section headings in these two sections render at `--text-2xl` using Fraunces at `font-weight: 460` and `letter-spacing: -0.02em`. Their headings stay attached while the section scrolls via `position: sticky` with `top: var(--space-8)`. Below 900px the grid collapses to a single column with the heading above the content. The sticky positioning MUST NOT change document/tab order, must NOT reorder the heading relative to its content, and must NOT create unreachable or unexpected focus targets.

#### Scenario: Two columns at wide width

- **GIVEN** the Flows or Decisions section displayed at a viewport width of 900px or more
- **WHEN** the layout is observed
- **THEN** the section heading occupies the `minmax(9rem, 1fr)` header column to the left of its prose in the `minmax(0, 3fr)` content column
- **AND** the heading renders at `--text-2xl`, Fraunces, weight 460, letter-spacing -0.02em

#### Scenario: Heading sticks and collapses below 900px

- **GIVEN** a viewer scrolled partway down the Flows or Decisions section at wide width
- **WHEN** they continue scrolling
- **THEN** the section heading remains visible, pinned at `top: var(--space-8)`
- **WHEN** the viewport width drops below 900px
- **THEN** the section collapses to a single column with the heading positioned above its content

#### Scenario: Sticky headings preserve focus order

- **GIVEN** a keyboard user tabbing through a Flows or Decisions section with a sticky heading
- **WHEN** they move focus with the keyboard
- **THEN** the order follows normal document order and the sticky heading neither reorders nor traps focus

### Requirement: Sections are separated by space, not hairlines

Major sections SHALL be separated by `--space-32`. All `border-bottom` section-divider rules SHALL be removed except the single rule beneath the hero that marks the transition from title to instrument, and the flow-row accent bar SHALL be retained as structural encoding of each scenario's flow hue.

#### Scenario: Hairline dividers are gone but flow accents remain

- **GIVEN** the rendered page after this change
- **WHEN** the gaps between major sections are measured
- **THEN** they are separated by `--space-32` rather than a bottom hairline rule
- **AND** the only `border-bottom` hairline rule remaining is the one beneath the hero
- **AND** each flow row still shows its left accent bar at `--scenario-flow`

#### Scenario: The hero retains its single rule

- **GIVEN** the `page-header` region
- **WHEN** its decorative rules are counted
- **THEN** exactly one `border-bottom` rule remains, beneath the hero, marking title-to-instrument

### Requirement: Hero uses the specified scale and spacing

The hero SHALL render its title at `--text-hero` with `max-width: 16ch` and `line-height: 0.98`, preceded above by `--space-32`. Between the title and the standfirst there is `--space-16`, the standfirst renders at `--text-lg`. Between the standfirst and the mono, lowercase readout there is `--space-8`, and between the readout and the stage there is `--space-24`.

#### Scenario: Hero establishes scale and vertical rhythm

- **GIVEN** the `page-header` region rendered at desktop width
- **WHEN** the vertical spacing and type of the hero are examined
- **THEN** the title renders at `--text-hero`, capped at 16ch, with `line-height: 0.98`
- **WHEN** the spacing down the hero is traced
- **THEN** there is `--space-32` above the title, `--space-16` to the standfirst at `--text-lg`, `--space-8` to the readout, and `--space-24` before the stage

### Requirement: Colour, motion, interaction, data, and excluded files are preserved

This change SHALL NOT alter any colour token, add or remove an animation, or change how existing motion behaves. The Web Animations API packets and offset-path tour, the scenario and progress-bar pulses driven by `--scenario-progress`, and the reduced-motion handling (transitions disabled and packets hidden under `prefers-reduced-motion`) SHALL behave exactly as before. Rendering code and content SHALL be unchanged, and `src/packet.ts`, `src/scenario.ts`, and all JSON data files SHALL not be modified.

#### Scenario: Motion and reduced-motion behaviour are unchanged

- **GIVEN** the running page at desktop width
- **WHEN** the scene plays
- **THEN** the packets and tour animate identically to before this change
- **WHEN** the browser requests reduced motion
- **THEN** transitions are disabled and the packets are hidden, identical to before this change

#### Scenario: Data and rendering modules are untouched

- **GIVEN** the state of `src/packet.ts`, `src/scenario.ts`, and the JSON data files
- **WHEN** this change is applied
- **THEN** those files are unmodified and the page consumes the same validated scenario and topology data
