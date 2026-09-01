# inference-topology Specification

## Purpose

Establishes how serving runtimes, models and llama-swap group members are represented in the topology, and records the member set currently in use.

The page presents scripted, synthetic flows. Nothing here introduces live telemetry, metrics, uptime or health, and every performance figure is a recorded measurement with no time reference.

**Constraint binding on every requirement:** this is a data and copy change. No layout, style, motion or component change is in scope, and no hop's `at` or `duration` value may change.

---

## ADDED Requirements

### Requirement: A node is a llama-swap group member

NInfer, vLLM and llama.cpp are serving runtimes — the same category of thing. Models become resident on the GPU. Neither alone is the right unit, because one artifact can appear in the group twice under different serving configurations that evict each other.

The topology SHALL represent each **llama-swap group member currently in use** as one node, labelled `{runtime} · {model}`. Where one runtime serves several members, each member SHALL have its own node and each label SHALL name that runtime; two nodes naming the same runtime is correct.

A runtime SHALL NOT have a node of its own. A group member not currently in use SHALL NOT have a node.

This rule SHALL be recorded in `DECISIONS.md` with its rationale: the group is what the diagram is about, its members are what evict each other, and `model-swap` animates between two of them.

#### Scenario: Each in-use member has exactly one node

- **GIVEN** the rendered topology
- **THEN** each of the four in-use group members has exactly one node
- **AND** each label is of the form `{runtime} · {model}`
- **AND** no node label names a runtime without naming a model

#### Scenario: Two nodes may name the same runtime

- **GIVEN** the rendered topology
- **THEN** at least two nodes have labels beginning `NInfer ·`
- **AND** they are distinct nodes with distinct ids and distinct incident edges

#### Scenario: The rule is recorded

- **GIVEN** `DECISIONS.md` after this change
- **THEN** it contains an entry stating that a node is a llama-swap group member rather than a runtime or a model file
- **AND** the entry states that one artifact may appear as two members under different serving configurations

---

### Requirement: The in-use member set is represented and the rest is recorded

The following four nodes SHALL exist in zone `wsl` with `kind: "infer"`:

| id | label |
|---|---|
| `qwen-uncensored` | `NInfer · Qwen3.8-27B Uncensored` |
| `ornith-dflash` | `NInfer · Ornith-1.5-35B` |
| `nemotron` | `vLLM · Nemotron 3.5 30B` |
| `comfy` | unchanged from its current label |

The `ninfer` and `vllm` nodes SHALL be removed.

The `swap` node's `detail` SHALL state that the group holds further configured members not currently in use, and SHALL NOT imply they have been removed from the machine.

Node count becomes 22 and edge count becomes 22.

#### Scenario: Nodes replaced, not edited in place

- **GIVEN** `src/data/topology.json` after this change
- **THEN** no node has id `ninfer` or `vllm`
- **AND** each of `qwen-uncensored`, `ornith-dflash` and `nemotron` exists exactly once, in zone `wsl`, kind `infer`, with the label above
- **AND** the topology has 22 nodes and 22 edges

#### Scenario: Unused members are recorded, not erased

- **GIVEN** the `swap` node's detail
- **THEN** it states that the group holds configured members not currently in use
- **AND** it does not imply those members have been uninstalled

---

### Requirement: Edges are renamed and hop timings are untouched

Edge `swap-ninfer` SHALL be renamed `swap-ornith-dflash` with `to: "ornith-dflash"`. Edge `swap-vllm` SHALL be renamed `swap-nemotron` with `to: "nemotron"`. A new edge `swap-qwen-uncensored` SHALL be added with `from: "swap"`, `to: "qwen-uncensored"`, `kind: "infer"`, `bidirectional: true`. All three keep `from: "swap"`, `kind: "infer"` and `bidirectional: true`.

The six hops in `scenarios.json` referencing `swap-ninfer` — four in `discord-task`, two in `model-swap` — SHALL be repointed to `swap-ornith-dflash`.

**No hop's `at` or `duration` value may change.** Only `edge` values change.

#### Scenario: Edges renamed and resolving

- **GIVEN** the topology after this change
- **THEN** no edge has id `swap-ninfer` or `swap-vllm`
- **AND** `swap-ornith-dflash`, `swap-nemotron` and `swap-qwen-uncensored` each exist once with `from: "swap"`, `kind: "infer"`, `bidirectional: true`
- **AND** `npm run validate` exits zero

#### Scenario: Hop timings are byte-identical

- **GIVEN** `src/data/scenarios.json` before and after this change
- **WHEN** every hop's `at`, `duration` and `reverse` values are compared in order
- **THEN** they are identical
- **AND** the only differences are six `edge` string values

#### Scenario: The model-swap dead pause survives

- **GIVEN** the `model-swap` scenario after this change
- **THEN** its last hop before the pause ends at 1500ms and the next begins at 2700ms
- **AND** its hop count and total duration are unchanged
- **AND** hop firing times are identical to before the change

---

### Requirement: Scenario prose names the correct models

`src/data/flow-content.json` SHALL be updated so `model-swap` and `discord-task` name the models actually involved. Neither may continue to name Qwen as the resident model swapped out for ComfyUI.

The `model-swap` prose SHALL continue to convey that exactly one member is resident at a time — that is the argument the scenario exists to make.

#### Scenario: Prose matches the data

- **GIVEN** `flow-content.json` after this change
- **THEN** the `model-swap` and `discord-task` entries name only models that have nodes in `topology.json`
- **AND** the `model-swap` entry still states that one member is resident at a time
- **AND** no entry names Nemotron as retired or vLLM as unused

---

### Requirement: The abliterated build's purpose is stated

The `qwen-uncensored` node's `detail` SHALL state what the model is for: adversarial testing and vulnerability discovery.

Every other node's detail explains why the thing is in the stack. This node is the one where an unexplained presence invites a reader to supply their own explanation.

The wording SHALL be a plain statement of purpose. It SHALL NOT be defensive, apologetic, or caveated.

#### Scenario: Purpose is stated plainly

- **GIVEN** the `qwen-uncensored` node's detail
- **THEN** it states the model's purpose in the stack
- **AND** it contains no apology, disclaimer, or justification framed as a defence

---

### Requirement: Measured performance figures live in node detail, not the readout

The `ornith-dflash` node's `detail` SHALL carry its recorded measurements: decode throughput, draft acceptance rate, and tokens per round.

Its `detail` SHALL identify it as the DFlash-speculation entry and state that a separate MTP entry exists in the group for image input. The `nemotron` node's `detail` SHALL retain the full model name `Nemotron 3.5 30B A3B`.

These figures SHALL NOT appear in `#hero-readout`.

Every figure SHALL be written as a recorded measurement with no time reference. Prohibited framings: "currently", "achieving", "sustained", "live", "real-time", "monitoring", or any construction implying the value is being sampled.

#### Scenario: Figures are in the inspector, not the readout

- **GIVEN** the page rendered
- **WHEN** the `ornith-dflash` node is selected
- **THEN** its detail contains the throughput, acceptance rate and tokens-per-round figures
- **AND** `#hero-readout`'s rendered text contains none of them

#### Scenario: No time-referencing framing

- **GIVEN** every node detail introduced or changed by this change
- **THEN** none contains "currently", "achieving", "sustained", "live", "real-time" or "monitoring"

---

### Requirement: The readout throughput key is model-neutral

`readout.json` and the `Readout` interface in `src/types.ts` SHALL replace `qwenThroughput` with a model-neutral key. A key naming a model means the next model change edits a type file rather than a data file.

The rendered readout line's content and format are otherwise unchanged.

#### Scenario: Key renamed, output unchanged

- **GIVEN** `src/types.ts` and `src/data/readout.json` after this change
- **THEN** neither contains the identifier `qwenThroughput`
- **AND** the interface and the JSON file agree on the new key
- **AND** `npx tsc --noEmit` passes
- **AND** the rendered readout still shows a throughput figure, a briefing time and a resident-model count

---

### Requirement: Existing invariants do not regress

All `data-model` invariants SHALL continue to hold, including rejection of an unresolved edge or hop reference and of a hop setting `reverse` on a non-bidirectional edge.

#### Scenario: Validation still catches broken references

- **GIVEN** an edge `to` value changed to a nonexistent node id
- **WHEN** `npm run validate` runs
- **THEN** it exits non-zero naming that edge id

#### Scenario: Validation still catches an unresolved hop

- **GIVEN** a hop referencing an edge id that does not exist
- **WHEN** `npm run validate` runs
- **THEN** it exits non-zero naming that hop and edge

#### Scenario: Reverse-on-one-way rule still enforced

- **GIVEN** a hop setting `reverse: true` on `n8n-resend`
- **WHEN** `npm run validate` runs
- **THEN** it exits non-zero naming that hop and edge

#### Scenario: No stale model names survive

- **GIVEN** the repository after this change
- **WHEN** user-visible strings are searched for `Qwen3.8-27B` used as the sole resident model, and for any reference to Nemotron as retired
- **THEN** none is present
