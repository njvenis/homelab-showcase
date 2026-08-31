## Why

The topology and animated flows need one validated, data-driven source of truth before rendering or animation work begins. This implements runbook Step 4 and prevents silent broken references or invalid reverse traversal from reaching the diagram.

## What Changes

- Add JSON data for the complete homelab topology and the five named scenarios.
- Add TypeScript types for zones, nodes, edges, scenarios, and hops, including `transitional`, `bidirectional`, and `reverse` semantics.
- Add a loader that validates referenced ids and rejects reverse hops on one-way edges with actionable errors.
- Add a standalone validation script and run it automatically before builds.

## Capabilities

### New Capabilities

- `data-model`: Define, load, and validate the topology and scripted scenario data used by the site.

### Modified Capabilities

None.

## Impact

- Adds `src/data/topology.json`, `src/data/scenarios.json`, `src/types.ts`, and `src/data/load.ts`.
- Adds `scripts/validate.ts` and the `validate` and `prebuild` package scripts.
- No runtime API or backend is introduced. The standalone TypeScript validator uses the runbook's `tsx` dev-only script runner (adding it to devDependencies if the prerequisite is not already present).
- The reviewer can deliberately break an edge reference, observe `npm run validate` fail naming that id, and observe `npm run build` refuse to proceed.
