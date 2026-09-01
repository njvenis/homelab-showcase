export type FlowKind = 'control' | 'infer' | 'memory' | 'health' | 'egress' | 'network'

export interface Zone {
  id: string
  label: string
  sub: string
  emphasis?: 'primary' | 'context'
}

export interface Node {
  id: string
  zone: string
  label: string
  kind: FlowKind
  detail: string
  transitional?: boolean
}

export interface Edge {
  id: string
  from: string
  to: string
  kind: FlowKind
  bidirectional?: boolean
}

export interface Hop {
  edge: string
  at: number
  duration: number
  reverse?: boolean
}

export interface Scenario {
  id: string
  name: string
  caption: string
  hops: Hop[]
}

export interface Topology {
  zones: Zone[]
  nodes: Node[]
  edges: Edge[]
}

export interface Readout {
  residentModels: number
  briefingTime: string
  primaryThroughput: string
}