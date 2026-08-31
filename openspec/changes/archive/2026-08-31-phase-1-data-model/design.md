## Context

This implements runbook Step 4 after the topology, direction, and one-way-edge decisions in `DECISIONS.md` have been settled. The site is a Vite + TypeScript static application with no framework or backend, and the starter repository currently has no data loader or validation command.

## Goals / Non-Goals

**Goals:**

- Keep topology and scenario content in JSON as the source of truth.
- Make invalid zone, node, edge, and hop references fail at module load with useful ids in the error.
- Reuse the same validation path from the application and the prebuild check.
- Preserve the edge/hop direction split: `bidirectional` controls rendering and `reverse` controls future travel direction.

**Non-Goals:**

- Rendering SVG, animating packets, or implementing scenario playback.
- Live telemetry, API calls, persistence, or a backend.
- Adding a schema-validation framework or graph-layout dependency.

## Decisions

- **JSON remains canonical.** Store the full topology in `src/data/topology.json` and the five scripted scenarios in `src/data/scenarios.json`; TypeScript types describe the shape but do not duplicate content. This follows the runbook and keeps later topology edits data-only.
- **Use direct TypeScript data types.** Define the five small domain types in `src/types.ts`, including optional `Node.transitional`, `Edge.bidirectional`, and `Hop.reverse`. This is simpler than introducing a runtime schema library for a fixed static dataset.
- **Validate on import.** `src/data/load.ts` imports the JSON, indexes ids, checks zone and edge endpoint references, then checks scenario hop references and reverse traversal rules before exporting validated data. A single module-load path prevents callers from bypassing validation.
- **Share the loader with the CLI check.** `scripts/validate.ts` imports the loader and reports success or the thrown error. Add the runbook's `tsx` dev-only runner if it is not already present, because the repository's current package metadata does not include it and the deployment build runs on Node 20.
- **Keep errors actionable.** Error messages include the invalid id and the relationship being checked (for example, missing node, zone, or edge), so a deliberately broken fixture can be repaired without debugging a generic parse failure.

## Risks / Trade-offs

- **[Risk]** A hand-authored JSON file can contain duplicate ids or malformed fields that simple reference checks miss → **Mitigation:** validate uniqueness and required enum/shape fields as part of the loader, and run the same loader before every build.
- **[Risk]** `tsx` adds a development tool to an otherwise dependency-light project → **Mitigation:** keep it dev-only and use it only for the standalone TypeScript validator; do not add a runtime library.
- **[Risk]** Import-time validation makes any bad data prevent application startup → **Mitigation:** this is intentional for a static showcase; the prebuild command catches the same failure before deployment.

## Migration Plan

Create the JSON files from runbook sections 3 and 4, add the types and loader, then wire `npm run validate` and `prebuild`. Run the valid-data check, deliberately break an edge reference to verify the failure path, restore the data, and commit the Step 4 checkpoint. Rollback is deleting the new data/loader/scripts and reverting the package script and devDependency changes.

## Open Questions

None.
