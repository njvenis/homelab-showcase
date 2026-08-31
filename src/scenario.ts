import { scenarios, topology } from './data/load.ts'
import { animatePacket, resetPacketActivity, type PacketHandle } from './packet.ts'
import type { Edge, Hop, Scenario } from './types.ts'

export type Arrival = {
  nodeId: string
  flowKind: Edge['kind']
  sequence: number
}

export type ScenarioState = Readonly<{
  scenarioId: string | null
  running: boolean
  caption: string | null
  currentHop: number | null
  completedHops: number
  totalHops: number
  arrival: Arrival | null
}>

export type ScenarioListener = (state: ScenarioState) => void

type ScheduledHop = {
  hop: Hop
  index: number
}

type ActivePacket = {
  handle: PacketHandle
  index: number
}

type ActiveRun = {
  scenario: Scenario
  hops: ScheduledHop[]
  nextHop: number
  startedAt: number
  scheduler?: number
  packets: ActivePacket[]
}

const edgesById = new Map(topology.edges.map((edge) => [edge.id, edge]))
const listeners = new Set<ScenarioListener>()
let sequenceCounter = 0
let state: ScenarioState = {
  scenarioId: null,
  running: false,
  caption: null,
  currentHop: null,
  completedHops: 0,
  totalHops: 0,
  arrival: null,
}
let activeRun: ActiveRun | undefined

function notify(): void {
  for (const listener of listeners) listener(state)
}

function setState(next: ScenarioState): void {
  state = next
  notify()
}

function validateScenario(scenario: Scenario): void {
  scenario.hops.forEach((hop, index) => {
    if (!Number.isFinite(hop.at) || hop.at < 0) {
      throw new Error(`scenario ${scenario.id} hop ${index + 1} has an invalid at offset`)
    }
    if (!Number.isFinite(hop.duration) || hop.duration <= 0) {
      throw new Error(`scenario ${scenario.id} hop ${index + 1} has an invalid duration`)
    }
    if (!edgesById.has(hop.edge)) {
      throw new Error(`scenario ${scenario.id} hop ${index + 1} references missing edge: ${hop.edge}`)
    }
  })
}

function idleState(): ScenarioState {
  return {
    scenarioId: null,
    running: false,
    caption: null,
    currentHop: null,
    completedHops: 0,
    totalHops: 0,
    arrival: null,
  }
}

function finish(run: ActiveRun): void {
  if (activeRun !== run) return
  activeRun = undefined
  if (run.scheduler !== undefined) window.clearTimeout(run.scheduler)
  setState({
    scenarioId: run.scenario.id,
    running: false,
    caption: null,
    currentHop: null,
    completedHops: run.scenario.hops.length,
    totalHops: run.scenario.hops.length,
    arrival: null,
  })
}

function maybeFinish(run: ActiveRun): void {
  if (run.nextHop < run.hops.length || run.packets.length > 0) return
  finish(run)
}

function launch(run: ActiveRun, scheduled: ScheduledHop): void {
  const edge = edgesById.get(scheduled.hop.edge)
  if (!edge) throw new Error(`scenario ${run.scenario.id} references missing edge: ${scheduled.hop.edge}`)

  const packet = animatePacket(edge.id, edge.kind, scheduled.hop.duration, scheduled.hop.reverse)
  const activePacket: ActivePacket = { handle: packet, index: scheduled.index }
  run.packets.push(activePacket)
  setState({
    ...state,
    currentHop: scheduled.index,
  })

  void packet.promise.then(() => {
    if (activeRun !== run) return
    const packetIndex = run.packets.indexOf(activePacket)
    if (packetIndex !== -1) run.packets.splice(packetIndex, 1)
    // Resolve the destination from the topology edge carrying this hop: a
    // reverse hop lands on edge.from, a forward hop on edge.to. Publish the
    // arrival alongside the completedHops tick so subscribers observe the
    // destination in the very same state change that marks the hop done.
    const arrival: Arrival = {
      nodeId: scheduled.hop.reverse ? edge.from : edge.to,
      flowKind: edge.kind,
      sequence: ++sequenceCounter,
    }
    setState({
      ...state,
      currentHop: run.packets.length ? run.packets[run.packets.length - 1].index : null,
      completedHops: state.completedHops + 1,
      arrival,
    })
    maybeFinish(run)
  })
}

function tick(run: ActiveRun): void {
  if (activeRun !== run) return
  run.scheduler = undefined
  const elapsed = performance.now() - run.startedAt

  while (run.nextHop < run.hops.length && run.hops[run.nextHop].hop.at <= elapsed) {
    const scheduled = run.hops[run.nextHop]
    run.nextHop += 1
    launch(run, scheduled)
  }

  if (run.nextHop < run.hops.length) {
    const delay = Math.max(0, run.hops[run.nextHop].hop.at - (performance.now() - run.startedAt))
    run.scheduler = window.setTimeout(() => tick(run), delay)
  }
  maybeFinish(run)
}

export function subscribe(listener: ScenarioListener): () => void {
  listeners.add(listener)
  listener(state)
  return () => listeners.delete(listener)
}

export function getState(): ScenarioState {
  return state
}

export function play(id: string): void {
  const scenario = scenarios.find((candidate) => candidate.id === id)
  if (!scenario) throw new Error(`unknown scenario: ${id}`)
  validateScenario(scenario)
  stop()

  const run: ActiveRun = {
    scenario,
    hops: scenario.hops
      .map((hop, index) => ({ hop, index }))
      .sort((left, right) => left.hop.at - right.hop.at || left.index - right.index),
    nextHop: 0,
    startedAt: performance.now(),
    packets: [],
  }
  activeRun = run
  setState({
    scenarioId: scenario.id,
    running: true,
    caption: scenario.caption,
    currentHop: null,
    completedHops: 0,
    totalHops: scenario.hops.length,
    arrival: null,
  })
  tick(run)
}

export function stop(): void {
  const run = activeRun
  if (run) {
    activeRun = undefined
    if (run.scheduler !== undefined) window.clearTimeout(run.scheduler)
    for (const packet of run.packets) packet.handle.cancel()
    run.packets.length = 0
  }
  resetPacketActivity()
  if (state.running || state.caption !== null || state.scenarioId !== null) setState(idleState())
}

export function reset(): void {
  stop()
}
