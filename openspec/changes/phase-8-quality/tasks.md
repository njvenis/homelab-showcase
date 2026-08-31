## 1. Quality baseline and worktree setup

- [x] 1.1 Capture the current Lighthouse accessibility score at the deployed base path and record the desktop and 380px visual baselines; verify the baseline evidence is available for the final before/after report. (Baseline Lighthouse accessibility: 100 at desktop and 380px.)
- [x] 1.2 Create the three isolated worktrees/branches `phase-8-motion`, `phase-8-responsive`, and `phase-8-a11y`, assign the scopes from design.md, and verify no worktree has overlapping ownership before implementation begins.

## 2. Motion worktree

- [x] 2.1 Implement reduced-motion presentation using the CSS `prefers-reduced-motion` media query so packets are not visually travelling while hop timing and edge activity remain active; verify no JavaScript media-query branch is needed and `npm run build` succeeds in the motion worktree.
- [x] 2.2 Verify the motion worktree with the operating system reduced-motion setting: run a scenario, observe sequential edge highlights that fade for each hop, confirm captions continue and scenarios are not disabled, then restore normal motion and confirm travelling packets still work; record the observations. (User confirmed the reduced-motion and restored normal-motion behavior works.)

## 3. Responsive worktree

- [x] 3.1 Add wide and stacked layout geometry in `src/layout.ts`, including node rectangles and edge anchors for zones arranged vertically; verify representative within-zone and cross-zone edge paths terminate on their current node rectangles in both layouts. (All 21 edge endpoints asserted at 1400, 899, and 380px.)
- [x] 3.2 Wire the stage resize/layout refresh to the rendered SVG without changing scenario or packet animation code, remove the narrow-screen overflow constraint, and style the narrow inspector as a bottom sheet; verify the page renders without horizontal overflow at 380px and that resizing across roughly 900px updates zone positions and edges.
- [x] 3.3 Verify the responsive worktree during an idle render and an active scenario at 380px and just below the layout threshold; record how edges crossing between stacked zones are routed from the layout model and confirm packet animation behavior is unchanged. (Cross-zone paths use deterministic left/right side channels derived in `src/layout.ts`; build and local 380px Lighthouse load passed.)

## 4. Accessibility worktree

- [x] 4.1 Add SVG roles, stable accessible title/name references, and a text alternative generated from the loaded `topology.json` zones, nodes, and edges; verify every topology item appears in the generated description without a separately maintained diagram summary.
- [x] 4.2 Correct muted-text contrast through shared CSS tokens and ensure scenario, inspector, and SVG-node focus rings remain visible in wide and stacked layouts; verify contrast and keyboard traversal at 380px with no color-only meaning.
- [x] 4.3 Run Lighthouse against the production page at its deployed base path and iterate until accessibility reaches 100; record the before and after scores and every accessibility change made. (Production baseline and local production-build result: 100; no failed audits.)

## 5. Merge and integration

- [x] 5.1 Merge `phase-8-motion`, then `phase-8-responsive`, then `phase-8-a11y`, resolving shared `main.ts`/`style.css` changes without dropping any quality contract; verify `npm run validate` and `npm run build` pass on the merged result.
- [x] 5.2 Run the runbook Step 11 quality-floor checkpoint on the merged page: toggle the OS reduced-motion setting (not a faked media query), confirm captions and fading edge highlights without travelling packets, verify the 380px stacked topology and bottom-sheet inspector with correctly routed cross-zone edges, confirm keyboard focus and generated diagram text, report baseline/after Lighthouse scores and all changes, then remove the temporary worktrees. (User confirmed the OS-level reduced-motion observation; temporary worktrees removed. Lighthouse remained 100 before and after.)
