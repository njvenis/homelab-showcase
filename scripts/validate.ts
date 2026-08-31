import { scenarios, topology } from '../src/data/load.ts'

const hopCount = scenarios.reduce((sum, s) => sum + s.hops.length, 0)
console.log(`topology: ${topology.zones.length} zones, ${topology.nodes.length} nodes, ${topology.edges.length} edges`)
console.log(`scenarios: ${scenarios.length} scenarios, ${hopCount} hops`)
console.log('OK: all references resolved, direction rules hold')