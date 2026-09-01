## Why

Three accessibility defects are live on the shipped page. The most serious: `#scenario-arrival` is an `aria-live` region written on every packet arrival — 17 times in 6.43 seconds for `discord-task` — and the idle tour loops all five scenarios indefinitely from load. A screen reader user receives continuous, unstoppable announcement with no way to stop it short of leaving the page.

Alongside it, `#hero-readout` is declared `role="status" aria-live="polite"` for content written once at load, and the 21 nodes each carry `tabindex="0"`, so passing the diagram by keyboard takes 21 Tab presses with no focus-return contract.

These are correctness defects, not design preferences. They are separated from the composition and interaction work in `phase-13b` and `phase-13c` so they can ship without waiting on a design review, and be reverted without touching anything visual.

A reviewer should be able to run `discord-task` with a `MutationObserver` on the live region and count two mutations, Tab past the diagram in one press, and see no pixel change anywhere.

## What Changes

- Replace the per-arrival live-region write with one announcement on scenario start and one on completion. The visual arrival pulse is unchanged.
- Remove `role="status"` and `aria-live` from `#hero-readout`.
- Implement roving tabindex on the node layer: one tab stop, arrow keys to move, Home/End, Enter/Space to open detail.
- Return focus to the invoking node when detail is dismissed by Escape or the close control.

## Non-Goals

- No visual change of any kind. Any pixel difference outside focus indicators is a defect in this change.
- No token, layout, or component change.
- No change to focus-on-open behaviour — the detail element is still a modal dialog here. That is revised in `phase-13b`, where it stops being modal.
- No change to `src/packet.ts`, scenario timing, or any data file.

## Capabilities

### Modified Capabilities

- `interaction`: arrival announcements bounded to one per scenario; hero readout is no longer a live region; node layer becomes a single tab stop with roving focus; focus returns to the invoking node on dismissal.

## Impact

- `index.html` (one element's attributes), `src/main.ts` (node markup attributes, `subscribe` handler, inspector close path).
- Not changed: `src/style.css`, `src/packet.ts`, `src/scenario.ts`, `src/layout.ts`, `src/types.ts`, any file under `src/data/`, `vite.config.ts`, `.github/workflows/deploy.yml`.

## Implementation Handoff

This proposal is implemented by a local-inference coding agent. Claude is the specification and design author, not the frontend builder.

Before starting, read `docs/implementation-handoff.md`. It is binding and covers: change order, files to inspect, files that may and may not be edited, commands per milestone, visual states and viewports to check, accessibility, data-validation and build checks, what constitutes a failed implementation, the register of open implementation decisions with recommended defaults, and the completion report format.

The implementing agent must not invent product requirements. Where a choice is genuinely open it appears in the handoff's decision register with a recommended default; anything not in that register and not settled by this spec is an ambiguity to report, not to resolve.

