import topologyJson from './topology.json'
import scenariosJson from './scenarios.json'
import type { Edge, Scenario, Topology } from '../types.ts'

function uniqueById<T extends { id: string }>(items: readonly T[], label: string): Map<string, T> {
  const byId = new Map<string, T>()
  items.forEach((item, i) => {
    const id = item.id
    if (typeof id !== 'string' || id === '') {
      throw new Error(`invalid ${label} id: entry ${i} has a missing or empty id`)
    }
    if (byId.has(id)) {
      throw new Error(`duplicate ${label} id: ${id}`)
    }
    byId.set(id, item)
  })
  return byId
}

export function validateTopology(topology: Topology): Map<string, Edge> {
  const zones = uniqueById(topology.zones, 'zone')
  const nodes = uniqueById(topology.nodes, 'node')
  const edges = uniqueById(topology.edges, 'edge')

  for (const node of topology.nodes) {
    if (!zones.has(node.zone)) {
      throw new Error(`node ${node.id} references missing zone: ${node.zone}`)
    }
  }

  for (const edge of topology.edges) {
    for (const endpoint of [edge.from, edge.to]) {
      if (!nodes.has(endpoint)) {
        throw new Error(`edge ${edge.id} references missing node: ${endpoint}`)
      }
    }
  }

  return edges
}

export function validateScenarios(scenarios: readonly Scenario[], edges: Map<string, Edge>): void {
  uniqueById(scenarios, 'scenario')

  for (const scenario of scenarios) {
    scenario.hops.forEach((hop, i) => {
      const edge = edges.get(hop.edge)
      if (!edge) {
        throw new Error(`scenario ${scenario.id} hop ${i + 1} references missing edge: ${hop.edge}`)
      }
      if (hop.reverse && !edge.bidirectional) {
        throw new Error(`scenario ${scenario.id} hop ${i + 1} sets reverse on one-way edge: ${hop.edge}`)
      }
    })
  }
}

const topology = topologyJson as Topology
const edges = validateTopology(topology)
const scenarios = scenariosJson as Scenario[]
validateScenarios(scenarios, edges)

export { topology, scenarios }