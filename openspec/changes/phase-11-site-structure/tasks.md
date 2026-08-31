## 1. Data and content

- [x] 1.1 Add the typed `src/data/readout.json` values for resident models, briefing time, and Qwen throughput, load them alongside the validated topology, and derive the node count from `topology.nodes`; verify `npm run validate` succeeds and no value is duplicated as a hardcoded metric in rendering code.
- [x] 1.2 Add the five two-sentence Flows descriptions and the three Decisions prose blocks in the project’s existing static/data content pattern; verify every `scenarios.json` id has exactly one description and the copy preserves the requested engineering meaning.

## 2. Page structure

- [x] 2.1 Add the single lowercase mono hero readout immediately below the standfirst, with the four values in order and spaced middle-dot separators; verify the rendered text contains no stat-card or big-number wrapper.
- [x] 2.2 Add the semantic Flows, Decisions, and footer structure around the existing application shell; verify Flows renders exactly five rows in scenario order, Decisions has exactly three blocks, and the footer contains only the repository link and `Built with the stack it describes.`.
- [x] 2.3 Render each Flows row with its scenario name, two-sentence description, native play button, and data-derived dominant-kind accent; verify the stage, rail, caption, legend, inspector, and SVG topology markup remain present and are not duplicated or rewritten.

## 3. Shared playback controls

- [x] 3.1 Bind Flows play buttons to the existing scenario engine and scroll the existing topology stage into view before playback; verify activating each row starts the matching rail scenario rather than a second scheduler, and reduced motion uses non-smooth scrolling.
- [x] 3.2 Extend the existing state projection so the active Flows row/control and matching rail button share running/stopped, progress, accessible status, completion, replacement, and reset treatment; verify starting, replacing, stopping, and completing from either control set leaves both locations synchronized.
- [x] 3.3 Verify keyboard access for every new play button with Tab, Enter, and Space, including visible focus, accessible names, running status, and stage scrolling without pointer input.

## 4. Visual and responsive treatment

- [x] 4.1 Style section headings and row names in Fraunces, body copy in the existing body family, and rows as full-width spacing-separated prose with a 3px left flow accent; verify there are no row borders, card containers, decorative section ornaments, or new colour literals outside the token system.
- [x] 4.2 Add the 380px responsive rules for the readout and Flows rows, allowing clean wrapping and narrow-screen control placement; verify a 380px viewport has no horizontal overflow, clipped readout values, or inaccessible controls.

## 5. Integration verification

- [x] 5.1 Run `npm run validate` and `npm run build`, then inspect the deployed-base-path page at desktop and 380px; verify the readout, five Flows rows, shared running treatment, Decisions prose, and one-line footer appear while the existing diagram behavior remains unchanged.
- [x] 5.2 Complete the runbook Step 6 v2-lit checkpoint and verification prompt: tab through the whole page including Flows controls, verify reduced-motion usability and text/non-colour state cues, confirm no console errors or overflow, and report any accessibility or contrast regression introduced by the surrounding structure.
