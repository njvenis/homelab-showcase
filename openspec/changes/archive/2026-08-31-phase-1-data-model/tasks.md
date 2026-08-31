## 1. Define the data contract

- [x] 1.1 Add `Zone`, `Node`, `Edge`, `Scenario`, and `Hop` types in `src/types.ts`, including the optional direction and transitional fields; verify the project type-checks against the declarations
- [x] 1.2 Add `src/data/topology.json` from runbook section 3, preserving unique zone, node, and edge ids and the settled one-way/bidirectional decisions; verify every declared edge endpoint and node zone is represented in the file
- [x] 1.3 Add `src/data/scenarios.json` from runbook section 4 with the five named scenarios, captions, ordered hops, timings, and reverse flags; verify every hop names an intended topology edge

## 2. Load and validate data

- [x] 2.1 Implement `src/data/load.ts` to load both JSON documents and export validated data at module load; verify valid project data imports without throwing
- [x] 2.2 Add validation for duplicate/invalid ids, missing node zones, missing edge endpoints, missing hop edges, and reverse hops on non-bidirectional edges; verify each failure throws an actionable error containing the offending id

## 3. Wire the build guard

- [x] 3.1 Add `scripts/validate.ts` that imports the shared loader and exits non-zero with the loader error; add the runbook's `tsx` devDependency if needed and wire `npm run validate` plus `prebuild`; verify `npm run validate` and `npm run build` pass with valid data

## 4. Step checkpoint

- [x] 4.1 Run the runbook Step 4 checkpoint: deliberately break an edge reference, verify `npm run validate` exits non-zero and names the bad id, verify `npm run build` refuses to run, restore the data, commit, merge the phase branch, tag `phase-1`, and archive the OpenSpec change
