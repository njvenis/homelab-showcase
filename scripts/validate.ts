import { scenarios, topology } from '../src/data/load.ts'
import { layout } from '../src/layout.ts'
import type { ZoneLayout } from '../src/layout.ts'

// Verify every topology zone has a wide-layout entry rather than duplicating the known
// ids here: the source of truth is src/layout.ts, so an unknown zone surfaces immediately
// as an actionable error instead of silently rendering undefined coordinates.
const zoneLayouts = layout.zones as Record<string, ZoneLayout>
for (const zone of topology.zones) {
  if (!zoneLayouts[zone.id]) {
    throw new Error(`zone ${zone.id} has no layout entry in src/layout.ts — add one before it can render`)
  }
}

const hopCount = scenarios.reduce((sum, s) => sum + s.hops.length, 0)
console.log(`topology: ${topology.zones.length} zones, ${topology.nodes.length} nodes, ${topology.edges.length} edges`)
console.log(`scenarios: ${scenarios.length} scenarios, ${hopCount} hops`)
console.log('OK: all references resolved, direction rules hold')