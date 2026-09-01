## Why

The site's inference section is materially wrong. It shows three nodes — `ninfer`, `vllm`, `comfy` — against a llama-swap group (`gpu-llms`, `swap: true`, `exclusive: true`) with eight members across three runtimes. The `vllm` node names Nemotron as a retired second model when Nemotron is in fact still a configured member; NInfer now holds several models rather than one; and llama.cpp, a third runtime in the group, is not represented at all.

Correcting it settles a rule the current data cannot express. Nodes conflate runtime and model — `ninfer` reads "NInfer · Qwen3.8-27B" — which worked while each runtime held one model. NInfer, vLLM and llama.cpp are the same category of thing: serving runtimes. And Ornith appears in the group twice on one artifact — MTP with `--vision`, and DFlash text-only at roughly five times the decode rate — so "a node is a model" cannot distinguish two entries that evict each other.

The rule that fits the system is **a node is a group member**: a unit llama-swap can make resident, and which evicts every other. That is exactly what `gpu-llms` enumerates and exactly what the `model-swap` scenario animates between.

## What Changes

- Replace the `ninfer` and `vllm` nodes with the four group members currently in use: `NInfer · Qwen3.8-27B Uncensored`, `NInfer · Ornith-1.5-35B DFlash`, `vLLM · Nemotron 3.5 30B A3B`, and the existing ComfyUI node.
- Record the four configured-but-unused members in the `swap` node's detail rather than as nodes.
- Rename edges `swap-ninfer` → `swap-ornith-dflash` and `swap-vllm` → `swap-nemotron`; add `swap-qwen-uncensored`.
- Repoint the six hops referencing `swap-ninfer` to `swap-ornith-dflash`. Hop `at` and `duration` values are unchanged, so no scenario timing moves.
- Update `flow-content.json` prose for `model-swap` and `discord-task`, which currently name Qwen as the resident model.
- State in the abliterated model's `detail` what it is for: adversarial testing and vulnerability discovery. An unlabelled abliterated build on a security practitioner's site invites the wrong inference.
- Generalise the model-specific `qwenThroughput` readout key.
- Record the group-member rule in `DECISIONS.md`.

## Non-Goals

- No layout, style, motion or component change. The `wsl` zone goes from 8 to 9 nodes, which fits the existing geometry at roughly 76px pitch; no zone rectangle is restructured.
- No change to any hop's `at` or `duration`. Only `edge` id values change.
- No node for a group member not currently in use, and no node for a runtime as such.
- No per-workload benchmark figures in the readout line.
- No implication of live telemetry. Every performance figure is a recorded measurement with no time reference.

## Capabilities

### New Capabilities

- `inference-topology`: establishes the group-member representation rule and records the current in-use member set.

### Modified Capabilities

- `data-model`: the `Readout` type's model-specific key is generalised. All existing validation invariants unchanged.

## Impact

- `src/data/topology.json`, `src/data/scenarios.json` (edge ids only), `src/data/flow-content.json`, `src/data/readout.json`, `src/types.ts`, `DECISIONS.md`, and `src/main.ts` only if the readout key rename requires it.
- Node count 21 → 22, edge count 21 → 22.

## Sequencing — read before scheduling

This change alters the node and edge counts, and `phase-13c-flow-focus`'s acceptance criteria contain the literal value 21 in several scenarios ("all 21 edge groups", "`path.edge` length is 21").

Ship this change **first**, then amend 13c's criteria before applying it. Prefer expressing them as `topology.edges.length` and `topology.nodes.length` rather than substituting 22 — a literal count in an acceptance criterion breaks on the next data change, which is how this conflict arose.

`phase-13a` and `phase-13b` are unaffected; neither touches data.
