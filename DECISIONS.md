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
