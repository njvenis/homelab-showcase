# Decisions

## Digest job runs on the workstation and currently calls Claude Cowork
Transitional — being ported to local inference. Not gated by llama-swap while it is hosted.
Consequence: `cowork` is an external node flagged `transitional`; scenario 1 is the only
flow that leaves the house, and it stops being so once the port lands.

## Edges carry `bidirectional`, hops carry `reverse`
Rendering and animation are separate concerns. One path per link, arrowheads from the
edge flag, direction of travel from the hop flag.
Rejected: declaring a second edge per return leg — doubles the edge list for no gain.

## Six edges are one-way, the rest are request/response
opencode-langfuse, cron-grafana, cron-n8n, digest-n8n, n8n-resend, resend-inbox.
Telemetry and mail only travel outward; everything else is a conversation.
Consequence: these six render with a single arrowhead, and the loader throws if a hop
sets `reverse` on any of them.

## A node is a llama-swap group member
A node represents a llama-swap group member, not a serving runtime or a model file.
Members are what become resident and evict one another; `model-swap` animates between
them. One artifact may appear as two members under different serving configurations.
A configured member not in use remains recorded in the `swap` detail rather than drawn
as a node.

The former `ninfer` and `vllm` runtime/model nodes were replaced by the in-use group
members: Qwen3.8-27B Uncensored and Ornith-1.5-35B DFlash on NInfer, plus Nemotron
3.5 30B A3B on vLLM. ComfyUI remains the existing group-member node.
