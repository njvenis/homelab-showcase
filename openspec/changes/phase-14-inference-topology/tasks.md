## 1. Confirm the implementation decisions

- [x] 1.1 Confirm the four in-use members (D1). Everything below assumes exactly these four have nodes.
- [x] 1.2 Confirm which member `discord-task`'s inference hops point at (D2).
- [x] 1.3 Confirm the readout's throughput figure now describes which member (D3).
- [x] 1.4 Confirm `phase-13c-flow-focus` has NOT yet been applied. If it has, stop — its acceptance criteria hardcode 21 nodes and edges and this change makes both 22.

## 2. Topology nodes

- [x] 2.1 Remove the `ninfer` and `vllm` nodes from `src/data/topology.json`.
- [x] 2.2 Add `qwen-uncensored` (`NInfer · Qwen3.8-27B Uncensored`), `ornith-dflash` (`NInfer · Ornith-1.5-35B DFlash`) and `nemotron` (`vLLM · Nemotron 3.5 30B A3B`), all zone `wsl`, kind `infer`.
- [x] 2.3 Write each node's `detail`. For `ornith-dflash`, include the recorded decode throughput, draft acceptance rate and tokens per round. For `qwen-uncensored`, state its purpose — adversarial testing and vulnerability discovery — plainly, with no disclaimer or apology.
- [x] 2.4 Update the `swap` node's `detail` to state that the group holds further configured members not currently in use, without implying they were uninstalled.
- [x] 2.5 Verify node count is 22, that no node has id `ninfer` or `vllm`, and that at least two node labels begin `NInfer ·`.

## 3. Topology edges

- [x] 3.1 Rename `swap-ninfer` → `swap-ornith-dflash` with `to: "ornith-dflash"`.
- [x] 3.2 Rename `swap-vllm` → `swap-nemotron` with `to: "nemotron"`.
- [x] 3.3 Add `swap-qwen-uncensored` with `from: "swap"`, `to: "qwen-uncensored"`, `kind: "infer"`, `bidirectional: true`.
- [x] 3.4 Verify edge count is 22, all three new ids exist exactly once, and `npm run validate` exits zero.

## 4. Scenario hops — ids only

- [x] 4.1 Take a snapshot first: `python3 -c "import json;print([[ (h['at'],h['duration'],h.get('reverse')) for h in s['hops']] for s in json.load(open('src/data/scenarios.json'))])" > /tmp/hops-before.txt`
- [x] 4.2 Repoint the six hops referencing `swap-ninfer` to `swap-ornith-dflash` — four in `discord-task`, two in `model-swap`. Change nothing else.
- [x] 4.3 Re-run the snapshot to `/tmp/hops-after.txt` and confirm the two files are byte-identical. Any difference means a timing moved and must be reverted.
- [x] 4.4 Verify `git diff src/data/scenarios.json` shows exactly six changed lines, each a single `edge` string.
- [x] 4.5 Play `model-swap` and confirm the pause between 1500ms and 2700ms is intact, and hop count and total duration are unchanged.

## 5. Scenario prose

- [x] 5.1 Update `model-swap` in `src/data/flow-content.json` so it names the models actually involved and still states that one member is resident at a time.
- [x] 5.2 Update `discord-task` so it names the model its inference hops point at.
- [x] 5.3 Verify no entry in `flow-content.json` names a model without a node in `topology.json`, and none describes Nemotron as retired or vLLM as unused.

## 6. Readout key

- [x] 6.1 Rename `qwenThroughput` in `src/data/readout.json` and in the `Readout` interface in `src/types.ts`. Verify neither contains the old identifier and `npx tsc --noEmit` passes.
- [x] 6.2 Update any reference in `src/main.ts`. Verify the rendered readout still shows a throughput figure, a briefing time and a resident-model count in the same format.

## 7. Decision record

- [x] 7.1 Add a `DECISIONS.md` entry: a node is a llama-swap group member, not a runtime and not a model file. State that one artifact may appear as two members under different serving configurations, and that a member not in use is recorded in the `swap` detail rather than drawn.
- [x] 7.2 Record the member set change itself: what was replaced, by what, on which runtime.

## 8. Verification

- [x] 8.1 `npx tsc --noEmit`, `npm run validate`, `npm run build` all pass.
- [x] 8.2 Negative test: break an edge `to` reference; confirm validate exits non-zero naming it; revert; confirm clean `git status`.
- [x] 8.3 Negative test: point a hop at a nonexistent edge id; confirm validate fails naming it; revert.
- [x] 8.4 Negative test: set `reverse: true` on `n8n-resend`; confirm validate fails naming hop and edge; revert.
- [x] 8.5 Play all five scenarios on the built site: zero `console.error`.
- [x] 8.6 Select each of the four inference nodes and confirm the inspector shows the intended detail, including the measured figures on `ornith-dflash`.
- [ ] 8.7 Verify no node detail introduced or changed contains "currently", "achieving", "sustained", "live", "real-time" or "monitoring".
- [ ] 8.8 Screenshot the `wsl` zone at 1440px and 390px. Nine nodes now occupy a zone sized for eight — confirm no label overlap and no text clipped by the zone's 454px inner width. `NInfer · Ornith-1.5-35B DFlash` is the longest label; report its rendered width.
- [ ] 8.9 Confirm the diff touches only `src/data/topology.json`, `src/data/scenarios.json`, `src/data/flow-content.json`, `src/data/readout.json`, `src/types.ts`, `DECISIONS.md`, and `src/main.ts` if the key rename required it.
- [ ] 8.10 Report the new node and edge counts so `phase-13c`'s criteria can be updated before it is applied.

## Implementation decisions

Take the recommended default unless you have a concrete reason not to, and report which you took.

| # | Decision | Recommended default |
|---|---|---|
| D1 | Which group members get nodes | The four in use: `qwen-uncensored`, `ornith-dflash`, `nemotron`, `comfy`. The other four are recorded in the `swap` detail |
| D2 | Which member `discord-task`'s inference hops point at | `swap-ornith-dflash`. The llama-swap config states DFlash is the right default for text and coding work |
| D3 | Which member the readout throughput figure describes | `ornith-dflash`, as the coding default. Report the figure used |
| D4 | New name for the `qwenThroughput` key | `primaryThroughput` |
| D5 | Whether to name the speculation mechanism in `ornith-dflash`'s detail | Name it. DFlash versus MTP on the same artifact is the reason the two entries exist, and a reader who understands acceptance rate learns more from it than from a token rate |
| D6 | Whether `ornith-dflash`'s detail mentions it cannot serve images | Yes, in one clause. It explains why an MTP entry also exists in the group |

## Out of scope, but worth reporting

- [ ] 9.1 `docs/opencode-prompt-pack.md` pins `ninfer/qwen3.8-27b`, which is inconsistent with both the llama-swap config and this change. Do not edit it here; report it so it can be corrected separately.
