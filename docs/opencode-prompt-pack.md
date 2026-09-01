# OpenCode Prompt Pack

Companion to `docs/runbook.md`. The runbook holds the reasoning; this holds what you paste.

> **Status: Steps 4–12 are complete and their prompts are spent.**
>
> Any prompt below that instructs an agent to read `docs/runbook.md` sections 3, 4
> or 6 as source data was written for the initial build. The runbook is now a frozen
> as-built record and its topology and scenario blocks are out of date. Re-running
> those prompts would rebuild the data files from stale values.
>
> For current work, use the change directories under `openspec/changes/` — each
> carries its own spec, tasks and acceptance criteria. The prompting notes at the
> end of this document still apply and are worth keeping.

**Change slugs do not match step numbers.** The slugs kept their names from an earlier draft organised in phases; the steps were renumbered and the slugs were not. Keep this table to hand — proposing the wrong change is how you end up three steps ahead of your dependencies:

| Change slug | Step | Builds |
|---|---|---|
| `phase-1-data-model` | Step 4 | types, topology.json, scenarios.json, loader, validator |
| `phase-4-packet` | Step 7 | `src/packet.ts` |
| `phase-5-scenario-engine` | Step 8 | `src/scenario.ts` |
| `phase-7-interaction` | Step 10 | rail, inspector, legend |
| `phase-8-quality` | Step 11 | reduced motion, responsive, a11y |

Dependency order is Step 4 → 7 → 8 → 10. The rail in `phase-7-interaction` needs the engine from `phase-5-scenario-engine`; proposing it earlier will block on a missing `src/scenario.ts`.

**Before anything else**, put the runbook in the repo so prompts can reference it rather than restating it:

```
docs/runbook.md
```

Commit it. Every prompt below assumes the agent can read it.

---

## Setup — AGENTS.md

The runbook does not create one, which is a gap. Write this to the repo root before Step 4. It stops you restating constraints in every prompt, and it is what the agent re-reads when context is cleared.

```markdown
# AGENTS.md

## Project
Static single-page interactive diagram of a homelab AI stack. Animated data flows are
scripted and synthetic — no live telemetry, no API calls, no backend.

Reference: docs/runbook.md. Section 3 is the topology, section 4 the scenarios,
section 6 the design tokens. DECISIONS.md records the data-shape decisions.

## Hard constraints
- Vite + TypeScript. No framework. No React, Vue, Svelte, or any UI library.
- No animation library. Web Animations API and CSS offset-path only.
- No graph layout library. Positions come from src/layout.ts.
- No Math.random() anywhere in animation or rendering code.
- All colour via CSS custom properties. No raw hex outside the token block in style.css.
- All topology and scenario content in JSON under src/data/. Never inline in code.
- Never edit files under docs/ unless asked.

## Direction model
Edges carry `bidirectional` — a rendering fact, arrowheads both ends or none.
Hops carry `reverse` — an animation fact, offset-distance 100% to 0%.
One path per link. Never declare a second edge for a return leg. See DECISIONS.md.

## Working style
- Stop and report after each deliverable set. Do not continue to the next step.
- If a constraint above blocks the task, say so and stop. Do not work around it.
- State any assumption you made rather than burying it in the code.
```

---

## Step 4 — Data model *(OpenSpec change)*

**4a. Propose.** In OpenCode:

```
/opsx-propose phase-1-data-model
```

Then paste:

```
Read docs/runbook.md sections 3 and 4, and DECISIONS.md.

Write the proposal for the data model change. Scope:
- TypeScript types for Zone, Node, Edge, Scenario, Hop
- topology.json and scenarios.json under src/data/
- a loader that validates references at module load
- a standalone validate script wired into prebuild

The specs must cover, as Given/When/Then:
- an edge referencing a node id that does not exist throws, naming the id
- a hop referencing an edge id that does not exist throws, naming the id
- a hop setting reverse:true on an edge without bidirectional:true throws
- a node with a zone that does not exist throws

Do not write implementation yet. Stop after the four artefacts and tell me what you produced.
```

Read all four before continuing. Then:

**4b. Apply.** On the branch:

```
/opsx-apply
```

If it needs steering, paste:

```
Implement the approved change. Deliverables:

1. src/types.ts
   - FlowKind: 'control' | 'memory' | 'infer' | 'health' | 'egress'
   - Zone { id, label, sub }
   - Node { id, zone, label, kind, detail, transitional? }
   - Edge { id, from, to, kind, bidirectional? }
   - Hop { edge, at, duration, reverse? }
   - Scenario { id, label, caption, hops }

2. src/data/topology.json
   Exactly the block in docs/runbook.md section 3. Do not add, rename, or
   reorder nodes or edges. Do not invent detail text.

3. src/data/scenarios.json
   The five scenarios from section 4, as ids and labels with empty hops arrays.
   Timings are authored at Step 9 — leave hops empty for now.

4. src/data/load.ts
   Imports both files, validates on module load, throws with the offending id
   named in the message. Exports typed topology and scenarios.

5. scripts/validate.ts plus package.json scripts:
   "validate": "tsx scripts/validate.ts"
   "prebuild": "npm run validate"

Then verify: temporarily change one edge's "to" to a nonexistent id, run
npm run validate, confirm it exits non-zero and names that id, and restore it.
Report the exact error message you saw.
```

**Checkpoint:** the deliberate break is caught and named. `npm run build` refuses to run with a broken reference.

---

## Step 5 — Static topology render

No spec. Four prompts, committing between each — so a bad result costs one prompt, not the step.

**5a. Layout config**

```
Read docs/runbook.md sections 3 and 6.

Create src/layout.ts exporting a layout config object: for each zone in
topology.json, an x, y, width and height on a 1400x900 viewBox. Three zones —
pi, wsl, ext. Leave generous internal padding; nodes are placed inside these
later.

Config only. No rendering, no SVG, no DOM. Stop when the file exists and
type-checks.
```

**5b. Node positions**

```
Add to src/layout.ts a pure function that takes a zone id and returns positions
for every node in that zone, laid out on a grid inside the zone's rectangle
from 5a.

Requirements:
- deterministic — same input, same output, no Math.random()
- reads the node list from src/data/load.ts, never a hardcoded list
- returns a Map of node id to { x, y }
- nodes must not overlap and must stay inside the zone rectangle

Pure function only. No DOM. Stop and show me the function.
```

**5c. Zone and node rendering**

```
Read docs/runbook.md section 6 for the tokens.

Render zones and nodes into a single inline SVG in index.html, using the layout
from src/layout.ts and the data from src/data/load.ts.

- zones as rounded rects, fill var(--surface), stroke var(--rule), with label and sub
- nodes as small rounded rects with a label, stroke var(--rule)
- nodes with transitional:true get a dashed stroke
- every position comes from layout.ts, nothing hardcoded in the render code
- no colour literals — CSS custom properties only

Stop after rendering. No edges yet.
```

**5d. Edges**

```
Add edge rendering to the SVG.

- compute anchor points on the node rectangles, choosing the sides that face each other
- draw each edge as a cubic Bezier path with an id matching the edge id
- stroke var(--rule) at rest
- arrowheads: single at the "to" end for one-way edges, both ends for
  bidirectional:true edges
- the path element must be queryable by edge id — Step 7 animates along its own d

Then verify: confirm every edge in topology.json produced exactly one path
element, and that the six one-way edges listed in DECISIONS.md have a single
arrowhead. Report any label collisions you see.
```

**Checkpoint:** every node and edge appears exactly once, no overlapping labels, transitional nodes dashed.

Then prove the data-driven claim yourself — move `cowork` to the `wsl` zone in topology.json, repoint its edge to `swap`, reload, confirm it redraws with no code change. Revert without committing.

---

## Step 6 — Design system

```
Read docs/runbook.md section 6.

Apply the design system to the existing render. Type scale on a 1.25 ratio from
16px body. Fraunces for the header display line, IBM Plex Sans for UI, IBM Plex
Mono only for literal machine strings in node labels — model names, throughput
figures.

Also add the page header: display line and one sentence of standfirst,
left-aligned.

Do not change any layout maths or rendering logic. Styling only.

Then run: grep -rE '#[0-9a-fA-F]{3,6}' src/ and report every hit. Only the token
block in style.css should appear.
```

---

## Step 7 — Packet primitive *(OpenSpec change)*

**7a. Propose**

```
/opsx-propose phase-4-packet
```

```
Read docs/runbook.md sections 4 and 6.

Propose the packet animation primitive. It animates a single packet along an
edge's own path using CSS offset-path with that path's d attribute.

Specs must cover, as Given/When/Then:
- a packet travels from the "from" anchor to the "to" anchor over its duration
- a hop with reverse:true travels the opposite way along the same path
- the edge takes its flow-kind colour while a packet is on it, fading back to
  var(--rule) over roughly 600ms after the last packet leaves
- two packets on the same edge concurrently do not corrupt each other's state
  or the fade-back
- under prefers-reduced-motion the packet does not travel; the edge highlights
  for the hop duration instead

No implementation. Stop after the artefacts.
```

**7b. Apply**

```
/opsx-apply
```

```
Implement src/packet.ts exporting a function that takes an edge id, a flow kind,
a duration in ms and an optional reverse flag, and returns a handle with a
cancel method.

Constraints:
- Web Animations API only. No animation library. No requestAnimationFrame loop.
- offset-path uses the edge path's own d attribute
- forward is offset-distance 0% to 100%, reverse is 100% to 0%
- the packet has a glow — an SVG filter or a CSS drop-shadow in the flow colour
- easing should feel physical, not linear
- reference-count the edge highlight so two concurrent packets do not cause an
  early fade-back
- cancel removes the packet and settles the highlight cleanly

Expose it on window temporarily so I can call it from the console.

Then verify: run two concurrent packets on one edge and confirm no glitch, and
tell me which easing you chose and why.
```

**Checkpoint:** single packet at 60fps, two concurrent packets clean. **Test Safari now** — `offset-path` with a raw `d` has quirks there and finding out at deploy is expensive.

---

## Step 8 — Scenario engine *(OpenSpec change)*

**8a. Propose**

```
/opsx-propose phase-5-scenario-engine
```

```
Propose the scenario engine. It reads a scenario from src/data/scenarios.json and
sequences its hops, calling the Step 7 packet primitive.

Specs must cover, as Given/When/Then:
- hops fire at their "at" offset from scenario start
- overlapping hops run concurrently — the Discord scenario needs four packets in
  flight at once for the subagent fan-out
- the same scenario played twice produces identical timing
- stop mid-run cancels every in-flight packet and settles every edge highlight
- reset returns the diagram to its idle state with no residue
- the caption updates as the scenario progresses

Determinism is a hard requirement: no Math.random() anywhere in the engine.

No implementation. Stop after the artefacts.
```

**8b. Apply**

```
/opsx-apply
```

```
Implement src/scenario.ts exporting play, stop and reset.

- a small store with subscribe/notify for current scenario and caption state.
  No state library.
- timing via a single scheduler, not one setTimeout per hop scattered across the
  module — stop must be able to cancel everything
- calling play while a scenario is running stops the current one first
- no Math.random()

Expose play, stop and reset on window as __scenario for now — Step 9 needs to
trigger scenarios before the selector UI exists. Mark it with a comment saying
it is removed at Step 10.

Then verify: run grep -r 'Math.random' src/ and report the result. Play a
scenario, stop it halfway, and confirm no packet elements remain in the DOM and
no edge is left highlighted. Report what you found.
```

---

## Step 9 — Scenario content

Five separate prompts, one per scenario, committing between each. This is authoring rather than building, so expect to iterate on timings — a hop array that reads badly is a rewrite of one JSON block, not code.

Each prompt ends with "show me the hop array before writing it" deliberately. Timing is the one thing you will want to argue with, and arguing before it lands in the file is cheaper.

**9.0 — Dev harness (throwaway)**

There is no way to play a scenario yet: the engine landed at Step 8, the selector UI does not arrive until Step 10. Build a temporary harness first, or you will be typing console commands thirty times per scenario while tuning.

```
Build a temporary dev harness for authoring scenarios. It is deleted at Step 10,
so keep it crude and keep it in one file: src/dev-harness.ts, imported from
main.ts behind an import.meta.env.DEV check.

- number keys 1 to 5 play the corresponding scenario from scenarios.json
- spacebar stops the running scenario
- r resets
- a fixed-position overlay in the corner showing: scenario id, elapsed ms since
  play, and the id of each hop as it fires
- the overlay must not be in the exported build

The elapsed-ms readout is the point — I am tuning timings by eye and need to know
what I am looking at when something reads wrong.

One file. No styling effort. Add a comment at the top: DELETE AT STEP 10.
```

**Driving it.** The harness self-registers — `main.ts` imports it behind the `import.meta.env.DEV` check, so it is live on the dev server and absent from the build. Nothing to invoke.

```bash
npm run dev
```

Open `http://localhost:5173/homelab-showcase/`. The path matters: `base` is set, so the dev server serves under it and bare `localhost:5173` returns a 404 that looks like a broken app.

Click once on the page before pressing anything. The listener is on the document, so with focus in the devtools console the keys go there instead — this is what will make you think the harness failed to build when it did not.

Then `1` to `5` to play, space to stop, `r` to reset.

Vite reloads on JSON changes, so the loop is: edit `scenarios.json`, page reloads, press the number key. Keep the browser and editor side by side.

**Do not skip the deletion at Step 10.** A dev harness that ships is a keyboard handler nobody remembers writing, firing on a public site.


**9a — Morning briefing**

```
Read docs/runbook.md section 4, scenario 1.

Author the hops for the morning-briefing scenario in src/data/scenarios.json.

Flow: the 08:30 digest job sends the day's threat intel to Claude Cowork and gets
the briefing back (digest-cowork, out and reverse), writes to local files, n8n
picks them up at 08:45 (digest-n8n), renders HTML and hands to Resend
(n8n-resend), which delivers to the work inbox (resend-inbox).

Timing notes: the Cowork round trip is the slow leg and the only one that leaves
the house — make it visibly slower than anything else in the scenario. The gap
between the 08:30 generation and the 08:45 pickup is real; represent it as a
pause rather than an instant handoff.

digest-n8n, n8n-resend and resend-inbox are one-way. No hop on those may set
reverse.

Show me the hop array before writing it.
```

**9b — Task from Discord**

```
Read docs/runbook.md section 4, scenario 2.

Author the hops for the Discord task scenario.

Flow out: discord-hermes, hermes-workspace, workspace-opencode, then opencode-swap
and swap-ornith-dflash for the inference. Memory reads and writes on opencode-mnemosyne.
A trace on opencode-langfuse. Then the result returns along the same path with
reverse:true — discord-hermes, hermes-workspace and workspace-opencode are all
bidirectional.

The subagent fan-out is the hard part. The topology has no subagent nodes, so
represent the cap of 4 as four concurrent packets on opencode-swap and
swap-ornith-dflash, offset slightly so they read as four things rather than one thick
line. This is the scenario that needs overlapping hops.

opencode-langfuse is one-way — traces go out, nothing comes back.

Show me the hop array before writing it.
```

**9c — Model swap**

```
Read docs/runbook.md section 4, scenario 3.

Author the hops for the model swap scenario. This is the one the page is built
around, so it needs the most care.

Flow: a task arrives needing imagery (opencode-swap). llama-swap unloads Ornith-1.5-35B DFlash
(swap-ornith-dflash, reverse). A pause where the GPU holds neither model. The diffusion
model loads (swap-comfy). ComfyUI generates and returns (swap-comfy, reverse).
Then the group returns to Ornith-1.5-35B DFlash (swap-ornith-dflash).

The pause is the point. It is what makes mutual exclusion visible rather than
described, and it is the only place on the page where nothing is moving on
purpose. Make it long enough to read as deliberate rather than as a bug — if a
viewer wonders whether the animation has broken, it is too long; if they do not
notice it, it is too short.

Show me the hop array before writing it, and tell me what pause duration you
chose and why.
```

**9d — Health sweep**

```
Read docs/runbook.md section 4, scenario 4.

Author the hops for the health sweep scenario.

Flow: cron fires its scheduled checks — cron-grafana for metrics, cron-n8n for
the pipeline trigger. Both edges are one-way, so no hop may set reverse.

This is the simplest scenario and should stay simple. Do not pad it to match the
length of the others. Two hops that read clearly are better than six that
manufacture activity — a health check genuinely is a small thing happening
regularly, and the animation should say that.

Show me the hop array before writing it.
```

**9e — Off-network access**

```
Read docs/runbook.md section 4, scenario 5.

Author the hops for the off-network access scenario.

Flow: a phone joins the tailnet (phone-tailscale), reaches Hermes
(tailscale-hermes), and the response returns along both edges with reverse:true.
Both are bidirectional.

The caption should carry the point that nothing is exposed publicly — the packet
never touches the ext zone except at its origin. If there is a way to make that
visible rather than only stated in the caption, suggest it, but do not add nodes
or edges to achieve it.

Show me the hop array before writing it.
```

**Checkpoint:** someone who has not seen the stack can describe what each scenario did. Play all five in sequence and watch for scenarios that look the same as each other — if 9a and 9d are indistinguishable in motion, the timings are not carrying information.

---

## Step 10 — Interaction *(OpenSpec change)*

```
/opsx-propose phase-7-interaction
```

```
Propose the interaction layer: scenario selector rail, node inspector panel,
and a legend mapping the five flow colours to their meaning.

Specs must cover, as Given/When/Then:
- clicking a node opens the inspector with its label, zone, kind and detail
- the canvas dims while the inspector is open
- Escape closes the inspector and returns focus to the node that opened it
- every node is reachable by keyboard with a visible focus ring
- the scenario rail is keyboard-operable and shows which scenario is running
- transitional nodes show their status in the inspector

No implementation. Stop after the artefacts.
```

Then `/opsx-apply`, and:

```
Implement it. Constraints:
- no dialog library, no focus-trap library — hand-rolled
- focus returns to the triggering node on close
- the inspector is a live region so screen readers announce it
- no hover lift on nodes; use a border-weight change

Also remove the temporary scaffolding from earlier steps:
- src/dev-harness.ts and its import in main.ts
- the window.__packet export from Step 7
- the window.__scenario export from Step 8

Then verify: traverse the entire page with Tab only, open and close the inspector
without a mouse, and report anything you could not reach or escape from. Also run
grep -rn '__packet\|__scenario\|dev-harness' src/ and confirm it returns nothing.
```

---

## Step 11 — Quality floor *(OpenSpec change, three worktrees)*

Propose once, then run three subagents in parallel worktrees. Three sits inside your fan-out cap of 4.

```
/opsx-propose phase-8-quality
```

**Worktree A — motion**

```
Implement prefers-reduced-motion support.

When the user prefers reduced motion, packets must not travel. Instead each edge
highlights for its hop duration and fades back, and the caption still steps
through the scenario. The scenario must remain comprehensible without movement.

Do not disable scenarios entirely. Do not use a JS media query check where a CSS
one works.

Then verify by toggling the OS setting, not by faking the media query, and tell
me what you observed.
```

**Worktree B — responsive**

```
Make the page work down to 380px wide.

Below roughly 900px the three zones stack vertically instead of sitting
side by side. Edges must re-route correctly against the new layout — this is a
change to src/layout.ts, not a CSS override on the SVG.

The inspector becomes a bottom sheet on narrow viewports.

Do not change any animation code. Report how you handled edges that cross
between stacked zones.
```

**Worktree C — accessibility**

```
Take Lighthouse accessibility to 100.

Expected work: SVG roles and accessible names, colour contrast on muted text
against the substrate, focus ring visibility, and a text alternative describing
the diagram for screen readers.

The text alternative must be generated from topology.json, not hand-written —
it goes stale otherwise.

Report the before and after scores and every change you made.
```

### Merging the three worktrees

A worktree is a second checkout of the same repository in a different directory, on a different branch. All three subagents work simultaneously without touching each other's files, and each produces an ordinary branch. Nothing special happens at merge time — it is three normal merges into `main`.

**Order matters, and it is not A, B, C.** Merge the most structural change first so the others resolve against a settled base:

```bash
git checkout main

git merge --no-ff phase-8-responsive     # B — changes layout.ts, deepest change
npm run dev                              # verify before continuing

git merge --no-ff phase-8-a11y           # C — render attributes and contrast
npm run dev

git merge --no-ff phase-8-motion         # A — animation layer, least entangled
npm run dev
```

B first because it rewrites zone rectangles and edge routing in `src/layout.ts`. C adds roles and accessible names to elements that B may have restructured, so C resolving against B is easier than the reverse. A touches `packet.ts` and `scenario.ts`, which neither of the others goes near, so it is cheapest last.

**Where the conflicts will be.** Almost all of them in `style.css`, because B adds media queries and C adds contrast and focus-ring rules, often in the same region of the file. These are usually keep-both conflicts rather than genuine disagreements — read them, but do not expect drama. A real conflict, where two branches changed the same rule to different values, means the specs overlapped and is worth a note in the change.

**Then re-run all three checks, not just the last one.** This is the step people skip and it is the reason to do the merges one at a time. A responsive layout change can break reduced motion; an accessibility fix can change focus behaviour the responsive branch depended on. Each branch passed its own check in isolation, which is not evidence that the merged result passes all three:

```
Re-verify the merged result against all three requirements in the phase-8-quality
spec, not just the change I merged last:

1. Toggle the OS reduced-motion setting and confirm packets do not travel, edges
   still highlight in sequence, and captions still step through.
2. Resize to 380px and confirm zones stack, edges re-route, and the inspector
   becomes a bottom sheet.
3. Run Lighthouse accessibility and confirm it is still 100.

Report each result separately. If any regressed, tell me which merge introduced
it rather than fixing it silently.
```

**Then clean up:**

```bash
git worktree remove ../showcase-motion
git worktree remove ../showcase-responsive
git worktree remove ../showcase-a11y
git branch -d phase-8-motion phase-8-responsive phase-8-a11y
git tag phase-8 && git push --follow-tags
```

`git worktree remove` refuses if the directory has uncommitted changes, which is a useful safety net — if it complains, something did not get committed.

Finally `/opsx-archive`, once, for the whole change. All three worktrees implemented tasks from the same `tasks.md`; it is one change with three parallel workstreams, not three changes.

**If the conflicts get unpleasant, abandon the parallelism.** `git merge --abort`, then do the three sequentially on one branch. You will have lost nothing but the demonstration, and three tasks on a codebase this size is genuinely marginal for worktrees — the value here is learning the mechanic on something low-stakes, not the time saved.

---

## Step 12 — Public repo hygiene

Run the history check yourself rather than delegating it:

```bash
git log -p | grep -nE '192\.168\.|\.ts\.net|[A-Za-z0-9_-]{32,}'
```

Then:

```
Write README.md. Contents:
- one paragraph on what the site shows
- a short architecture summary drawn from docs/runbook.md section 3
- how to run it locally
- a note that flows are scripted and synthetic, not live telemetry
- a link to DECISIONS.md

Do not include any IP address, tailnet hostname, or internal URL. Do not
describe the stack in marketing language — plain statements only.
```

**Checkpoint:** live URL loads with no console errors, every asset resolves under the base path, animation smooth on a mid-range phone. Check in a private window.

---

## Prompting notes

- **One prompt, one deliverable set.** The "stop and report" line at the end of each prompt is doing real work — without it Qwen3.8-27B Uncensored runs on into the next step and you lose the checkpoint.
- **Ask it to verify and report, not just to build.** Every prompt above ends with a check whose result you read. A model that reports "validate exited 1 naming edge discord-hermes" has demonstrably run it; one that says "done" has not.
- **When a prompt fails twice, do not paste it a third time.** Reduce scope and split it. Two failures usually means the prompt is asking for two things.
- **Clear context between steps.** AGENTS.md and `docs/runbook.md` are what the agent re-reads; that is the point of putting them in the repo.
- **Throwaway code needs a deletion checkpoint, not good intentions.** Step 7 puts the packet primitive on window, Step 9 adds a dev harness. Both are deleted at Step 10, and Step 10's checkpoint checks for them.
