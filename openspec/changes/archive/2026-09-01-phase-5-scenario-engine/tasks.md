## 1. Deterministic scheduling

- [x] 1.1 Add the scenario engine module and its typed playback state/subscription surface, loading scenarios only from the validated data module; verify the module exposes play, stop, reset, and caption/progress state without duplicating scenario content.
- [x] 1.2 Schedule every hop from one run start using its declared `at` offset, passing the declared duration and reverse flag to the Step 7 packet primitive; verify controlled-timer checks observe each hop at the expected offset and `grep -rn 'Math.random' src/` returns nothing.
- [x] 1.3 Preserve concurrent hop lifecycles and stale-run protection so overlapping hops are not serialized or replaced and a new play supersedes the old run; verify the Discord fan-out records four simultaneous packet handles and a replaced run produces no later callbacks.

## 2. Lifecycle and page integration

- [x] 2.1 Implement stop and reset resource cleanup for scheduled timers, in-flight packet handles, packet-owned edge activity, and stale progress; verify stopping mid-run cancels all remaining work and reset leaves no packet, highlight, timer, or progress residue.
- [x] 2.2 Add the minimal packet-activity cleanup/reset hook needed for immediate idle restoration without changing the Step 7 single-hop contract; verify an interrupted edge returns to `var(--rule)` and existing packet overlap/reduced-motion behavior still passes its checks.
- [x] 2.3 Publish the active scenario caption and lifecycle updates to the page surface, replacing it on a new play and clearing it on completion, stop, and reset; verify the displayed caption follows each scenario run and no stale caption remains after cleanup.

## 3. Integration checkpoint

- [x] 3.1 Run `npm run validate` and `npm run build`, then complete the runbook Step 8 checkpoint: play a scenario twice and confirm identical timing, stop mid-run and confirm no orphaned packets or stuck highlights, verify the Discord scenario shows four concurrent packets, and confirm `grep -r 'Math.random' src/` returns nothing.
