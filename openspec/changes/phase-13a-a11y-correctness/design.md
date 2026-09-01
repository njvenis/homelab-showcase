# Design — phase-13a-a11y-correctness

## Why this is separate

The live-region defect makes the page unusable with a screen reader from load. Bundling it with a design change means it ships when the design review finishes, which is the wrong trade. Split out, it is a small, legible, independently revertible correction with no visual surface to argue about.

## Roving tabindex is a modification, not an addition

Every node currently carries `tabindex="0"` (`src/main.ts` ~151). That satisfies "reachable by keyboard" and was accepted in the phase-8 quality gate, so this is a deliberate revision of shipped behaviour rather than a gap being filled. It is filed as a MODIFIED requirement with the current behaviour stated, so anyone reading the archive later can see what changed and why.

The trade: 21 Tab presses becomes one, at the cost of requiring arrow keys to reach individual nodes. That is the standard composite-widget pattern and is what a screen reader user will expect from a `role="button"` collection inside a labelled group.

Arrow handling is bound on the node layer rather than `document`, so it cannot intercept arrow keys used elsewhere on the page — including the horizontal scenario rail introduced later in `phase-13b`.

## Focus on open is deliberately left alone

`closeInspectorButton.focus()` on open is correct while the element is `role="dialog" aria-modal="true"`. Changing it here, while the modal semantics remain, would produce a dialog that opens without focus inside it — worse than what ships today. The revision belongs with the change that removes the modal semantics, and is specified there.

## Risks

- **Roving tabindex implemented incorrectly makes nodes unreachable.** Mitigated by two acceptance scenarios that traverse all 21 nodes and assert exactly one `tabindex="0"` at every step.
- **Arrow handlers bound too broadly** would break the page's other controls. Mitigated by an explicit scenario asserting arrow keys elsewhere do not move node focus.
- **The live-region change could over-correct into silence.** Mitigated by requiring exactly two announcements, not zero, and by a separate scenario confirming the visual pulse still fires.

## Rollback

Revert the commit. No data, token or layout state is carried, so nothing downstream depends on it. The only caveat: `phase-13b` and `phase-13c` assume the roving-tabindex model when specifying keyboard behaviour, so reverting after those have shipped requires revisiting their keyboard scenarios.
