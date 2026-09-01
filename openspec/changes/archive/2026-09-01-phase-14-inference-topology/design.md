# Design — phase-14-inference-topology

## What a node is

NInfer, vLLM and llama.cpp are the same category of thing: serving runtimes. Models are what become resident on the GPU. But "a node is a model" fails on the real config, because Ornith appears twice on one artifact — `ornith-1.5-35b` with MTP and `--vision`, and `ornith-1.5-35b-dflash` with the DFlash draft head, text-only, decoding roughly five times faster. Same weights, same file, two entries that evict each other.

The unit that actually matters is **the group member**: a thing llama-swap can make resident, and whose residency excludes every other. That is what `gpu-llms` enumerates, what the mutual-exclusion constraint operates on, and what `model-swap` animates between.

Labels take the form `{runtime} · {model}`. Two nodes naming NInfer is correct, not duplication — it is the fact that one runtime holds several swappable configurations.

A runtime as such gets no node. Neither does a configured member that is not in use.

## Which members appear

Four are in use: Qwen3.8-27B Uncensored on NInfer, Ornith-1.5-35B DFlash on NInfer, Nemotron 3.5 30B on vLLM, and ComfyUI. Those get nodes.

Four are configured but not in use — the censored NVFP4 Qwen, Ornith MTP, `qwen3-vl-8b`, and the obliterated NVFP4 build. They are recorded in the `swap` node's detail. A reader learns the group is larger than the diagram, which is truer than either showing eight nodes that mostly never light up or pretending the other four do not exist.

This is the same treatment the earlier draft gave vLLM, applied consistently: the managing node's detail carries what exists but does not carry traffic.

## The abliterated build

`qwen3.8-27b-uncensored-ninfer` is the primary text model in use and it is an abliterated build. It appears on the diagram at the user's explicit direction.

Its `detail` states the purpose: adversarial testing and vulnerability discovery. This is not defensiveness — it is the same standard the rest of the page holds itself to. Every other node's detail explains why the thing is there. An abliterated model on a security practitioner's public site with no stated purpose is the one node where a reader will supply their own explanation, and it will be the wrong one.

## Which model the coding scenario points at

`discord-task` animates a coding task arriving through OpenCode. Its four fan-out hops currently reference `swap-ninfer`.

The config states DFlash is "the right default for all text and coding work", so those hops point at `swap-ornith-dflash`. Six hops change their `edge` value; no `at` or `duration` moves, so `model-swap`'s 1200ms dead pause — the interval between 1500ms and 2700ms where the GPU holds neither model — is untouched.

Worth noting separately: `docs/opencode-prompt-pack.md` still pins `ninfer/qwen3.8-27b`. That is now inconsistent with both the config and this change. Out of scope here, but it will mislead the next person to run the prompt pack.

## Performance figures

The DFlash measurements — roughly 585 tok/s on a code prompt at 47% acceptance and 4.30 tokens per round — go in the Ornith node's `detail`, not the readout line. Three figures per workload in a masthead strip read as a benchmark table, which is the closest this page has come to appearing to report metrics.

They are written as recorded measurements with no time reference. Acceptance rate earns its place alongside throughput: a reader who knows what draft acceptance means learns more from 47% than from a token rate, and one who does not is not misled.

The config's finding that `--lm-head-draft` is worth +15% prose and +22% code on the dense Qwen but costs ~18% on the Ornith MoE is the strongest single piece of inspector copy available. It demonstrates a swept parameter space rather than a followed model card.

## Risks

- **Node and edge counts change from 21 to 22**, and `phase-13c-flow-focus` hardcodes 21 in several acceptance criteria. Sequencing is stated in the proposal; the durable fix is making those criteria data-derived.
- **Nine nodes in the `wsl` zone** against eight today. At 550×780 with 48px padding that is roughly 76px pitch, comfortably above the 36px node height. Label length is the real constraint: `NInfer · Ornith-1.5-35B DFlash` in a 454px column needs checking on the preview.
- **The primary text model being an abliterated build** is a deliberate editorial choice. The mitigation is stated purpose, not omission.

## Rollback

Revert the commit. Hop timings never changed, so no scenario needs retuning. `phase-13c`'s counts would revert to 21 alongside.
