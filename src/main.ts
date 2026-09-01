import './style.css'
import { animatePacket, refreshPacketPaths, type PacketHandle } from './packet.ts'
import flowContentJson from './data/flow-content.json'
import type { FlowKind } from './types.ts'
import type { Topology, Scenario } from './types.ts'
import type { NodeRect, StageLayout } from './layout.ts'
import type { Arrival, ScenarioState } from './scenario.ts'

const NODE_RX = 8
const ZONE_RX = 16

const kindLabels: Record<FlowKind, string> = {
  control: 'Control',
  infer: 'Inference',
  memory: 'Memory',
  health: 'Health',
  egress: 'Egress',
  network: 'Network',
}

// Per-flow descriptions for the derived legend. The legend *entries* are data
// derived (see renderLegend); these are the static labels/meanings describing each.
const LEGEND_MEANING: Record<FlowKind, string> = {
  control: 'orchestration and commands',
  infer: 'model work',
  memory: 'reads and writes',
  health: 'checks and telemetry',
  egress: 'outbound delivery',
  network: 'peer and inbound links',
} as const

// Order in which a scenario's dominant flow hue is picked (existing tie-break
// behaviour: earliest kind wins a count tie). Distinct from LEGEND_KIND_ORDER below.
const DOMINANT_FLOW_ORDER: readonly FlowKind[] = [
  'control', 'memory', 'infer', 'health', 'egress', 'network',
]

// Canonical legend order, filtered to the kinds actually present on edges so the
// key is deterministic regardless of data ordering.
const LEGEND_KIND_ORDER: readonly FlowKind[] = [
  'control', 'infer', 'memory', 'health', 'network', 'egress',
]

// Scenario state carries the running participating-edge set on subscribers; declare
// it here so main.ts can read it without editing scenario.ts.
const EMPTY_PARTICIPATING = new Set<string>()

// Data-module bindings, populated once in init() from the dynamically loaded loaders.
// Render helpers below read these at call time, so they can stay definition-only here.
let topology!: Topology
let scenarios!: Scenario[]
let nodeHeight = 0
let edgePath!: (from: NodeRect, to: NodeRect, stageLayout?: StageLayout) => string
let getNodeRects!: (zoneId: string, stageLayout?: StageLayout) => Map<string, NodeRect>
let selectLayout!: (stageWidth: number) => StageLayout
let firstNodeId: string | undefined
let dominantFlowById!: Map<string, FlowKind>

function dominantFlowKind(scenario: typeof scenarios[number]): FlowKind {
  const counts = new Map<FlowKind, number>()
  for (const hop of scenario.hops) {
    const kind = topology.edges.find((edge) => edge.id === hop.edge)?.kind
    if (kind) counts.set(kind, (counts.get(kind) ?? 0) + 1)
  }
  let chosen: FlowKind = 'control'
  let highest = -1
  for (const kind of DOMINANT_FLOW_ORDER) {
    const count = counts.get(kind) ?? 0
    if (count > highest) {
      highest = count
      chosen = kind
    }
  }
  return chosen
}

function renderFlowsSection(): string {
  const rows = scenarios.map((scenario) => {
    const flow = dominantFlowById.get(scenario.id) ?? 'control'
    const description = (flowContentJson as Record<string, string>)[scenario.id]
    if (!description) {
      throw new Error(`missing flow content for scenario: ${scenario.id}`)
    }
    return (
      `<article class="flow-row" style="--scenario-flow: var(--flow-${flow})">` +
      `<div class="flow-row__body">` +
      `<h3 class="flow-row__title">${esc(scenario.name)}</h3>` +
      `<p class="flow-row__text">${esc(description)}</p>` +
      '</div>' +
      `<button class="flow-row__play" type="button" data-scenario-id="${esc(scenario.id)}" aria-label="Play ${esc(scenario.name)} scenario"${scenarioPlayable(scenario) ? '' : ' disabled'}><span class="flow-row__label">Play</span><span class="flow-row__progress" aria-hidden="true"></span><span class="scenario-button__status" hidden>Running</span></button>` +
      '</article>'
    )
  }).join('')
  return '<section class="flows" aria-labelledby="flows-title"><h2 id="flows-title">Flows</h2>' + rows + '</section>'
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Reference-style validation errors end with ": <id>"; take that trailing id so the
// error names the offending reference. Falls back to the last token for messages with
// no id token (e.g. a missing/empty id entry).
function brokenIdFromError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  const tail = message.slice(message.lastIndexOf(':') + 1).trim().replace(/[.!]\s*$/, '')
  return tail.includes(' ') && tail.toLowerCase() !== 'id'
    ? message.slice(message.lastIndexOf(' ') + 1).trim()
    : tail || 'unknown'
}

function topologyDescription(): string {
  const labelById = new Map(topology.nodes.map((node) => [node.id, node.label]))
  const zones = topology.zones
    .map((zone) => {
      const members = topology.nodes.filter((node) => node.zone === zone.id).map((node) => node.label).join(', ')
      const sub = zone.sub ? ` (${zone.sub})` : ''
      return `Zone ${zone.label}${sub}: ${members}`
    })
    .join('. ')
  const connections = topology.edges
    .map((edge) => {
      const from = labelById.get(edge.from) ?? edge.from
      const to = labelById.get(edge.to) ?? edge.to
      return edge.bidirectional
        ? `${from} and ${to} connect bidirectionally (${kindLabels[edge.kind]} flow)`
        : `${from} sends to ${to} (${kindLabels[edge.kind]} flow)`
    })
    .join('. ')
  return `Diagram of the homelab stack. ${zones}. Connections: ${connections}`
}

// First node in document order owns the lone roving tabindex=0; every other node
// starts tabindex=-1. Document order is stable across responsive re-layout, which
// only updates coordinates, never node order.
function renderTopology(stageLayout: StageLayout): string {
  const { width, height } = stageLayout.viewBox

  const zoneEls = topology.zones.map((zone) => {
    const r = stageLayout.zones[zone.id]
    if (!r) throw new Error(`no layout for zone: ${zone.id}`)
    // emphasis defaults to primary when absent; only "context" renders distinctly.
    const isContext = (zone as { emphasis?: string }).emphasis === 'context'
    const zoneClass = isContext ? 'zone zone--context' : 'zone'
    // The zone-label/sub-label are siblings of the rect, not descendants, so they must
    // carry the context marker themselves for CSS to dim them — a descendant selector
    // off the rect could never reach them.
    const labelClass = isContext ? `zone-label zone--context` : 'zone-label'
    const subClass = isContext ? `zone-sub zone--context` : 'zone-sub'
    return (
      `<rect class="${zoneClass}" data-zone-id="${esc(zone.id)}" data-emphasis="${isContext ? 'context' : 'primary'}" x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="${ZONE_RX}"/>` +
      `<text class="${labelClass}" data-zone-label="${esc(zone.id)}" x="${r.x + r.padding}" y="${r.y + r.padding}">${esc(zone.label)}</text>` +
      (zone.sub ? `<text class="${subClass}" data-zone-sub="${esc(zone.id)}" x="${r.x + r.padding}" y="${r.y + r.padding + 22}">${esc(zone.sub)}</text>` : '')
    )
  })

  const nodeRects = new Map<string, NodeRect>()
  topology.zones.forEach((zone) => {
    for (const [id, rect] of getNodeRects(zone.id, stageLayout)) nodeRects.set(id, rect)
  })

  const markerDefs = '<defs><marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><polygon class="edge-marker" points="0,0 9,5 0,10"/></marker></defs>'

  // Each edge's glow + edge paths are wrapped so focus dimming (opacity on the group)
  // never collides with packet.ts mutating the inner path elements. Inner classes,
  // ids, data-edge-id, markers and d are unchanged; no node wrapper is added here.
  // Derived endpoint/kind text cue for edge hover. Surfaced as a native SVG <title>,
  // so it is available to assistive tech and shows as the browser tooltip without the
  // edge ever becoming a keyboard focus stop. Direction stays encoded only by the
  // edge arrows/markers; this text never implies direction beyond declaring endpoints.
  const edgeLabelOf = (id: string): string => topology.nodes.find((node) => node.id === id)?.label ?? id
  const edgeEls = topology.edges.map((edge) => {
    const from = nodeRects.get(edge.from)!
    const to = nodeRects.get(edge.to)!
    const d = edgePath(from, to, stageLayout)
    const markers = edge.bidirectional
      ? 'marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"'
      : 'marker-end="url(#arrowhead)"'
    const cueArrow = edge.bidirectional ? '↔' : '→'
    const edgeCue = `${edgeLabelOf(edge.from)} ${cueArrow} ${edgeLabelOf(edge.to)} (${kindLabels[edge.kind]} flow)`
    return (
      `<g class="edge-group" data-edge-id="${esc(edge.id)}">` +
      `<title>${esc(edgeCue)}</title>` +
      `<path class="edge-glow edge--${esc(edge.kind)}" data-edge-id="${esc(edge.id)}" d="${d}" aria-hidden="true" pointer-events="none"/>` +
      `<path class="edge edge--${esc(edge.kind)}" id="${esc(edge.id)}" d="${d}" ${markers}/>` +
      '</g>'
    )
  })

  const nodeEls = topology.zones.flatMap((zone) => {
    return topology.nodes.filter((node) => node.zone === zone.id).map((node) => {
      const rect = nodeRects.get(node.id)!
      const centerX = rect.x + rect.width / 2
      const centerY = rect.y + rect.height / 2
      const transitionalClass = node.transitional ? ' node--transitional' : ''
      const zoneLabel = topology.zones.find((candidate) => candidate.id === node.zone)?.label ?? node.zone
      return (
        `<g class="node-control node--${node.kind}" data-node-id="${esc(node.id)}" data-node-kind="${esc(node.kind)}" role="button" tabindex="${node.id === firstNodeId ? '0' : '-1'}" focusable="true" aria-label="Inspect ${esc(node.label)} in ${esc(zoneLabel)}">` +
        `<rect class="node-accent" x="${rect.x.toFixed(1)}" y="${rect.y.toFixed(1)}" width="3" height="${nodeHeight}" data-node-kind="${esc(node.kind)}" aria-hidden="true" style="pointer-events:none"/>` +
        `<rect class="node-box${transitionalClass}" x="${rect.x.toFixed(1)}" y="${rect.y.toFixed(1)}" width="${rect.width.toFixed(1)}" height="${nodeHeight}" rx="${NODE_RX}"/>` +
        `<text class="node-label" x="${centerX.toFixed(1)}" y="${(centerY + 4).toFixed(1)}">${esc(node.label)}</text>` +
        '</g>'
      )
    })
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="group" aria-labelledby="topology-title" aria-describedby="topology-desc"><title id="topology-title">Homelab stack topology</title><desc id="topology-desc">${esc(topologyDescription())}</desc>${markerDefs}${zoneEls.join('')}${edgeEls.join('')}${nodeEls.join('')}</svg>`
}

// Scenario metadata derived from the script, never authored into src/data/. Hop
// count is hops.length; duration is max(at + duration), guarded so an empty hop
// array renders only "0 hops" (max() over [] is -Infinity and must not reach the DOM).
function scenarioPlayable(scenario: typeof scenarios[number]): boolean {
  return scenario.hops.length > 0
}

function scenarioSummary(scenario: typeof scenarios[number]): string {
  const count = scenario.hops.length
  if (count === 0) return '0 hops'
  const maxMs = Math.max(...scenario.hops.map((hop) => hop.at + hop.duration))
  return `${count} hops · runtime ${(maxMs / 1000).toFixed(1)}s`
}

function renderScenarioRail(): string {
  const buttons = scenarios.map((scenario) => (
    `<button class="scenario-button" type="button" data-scenario-id="${esc(scenario.id)}"` +
    (!scenarioPlayable(scenario) ? ' disabled' : '') + `>` +
    `<span class="scenario-button__name">${esc(scenario.name)}</span>` +
    `<span class="scenario-button__meta">${esc(scenarioSummary(scenario))}</span>` +
    `<span class="scenario-button__progress" aria-hidden="true"></span>` +
    `<span class="scenario-button__status" hidden>Running</span>` +
    '</button>'
  ))
  return (
    '<nav class="scenario-rail" aria-labelledby="scenario-title">' +
    '<div class="scenario-rail__intro">' +
    '<h2 id="scenario-title">Scripted flows</h2>' +
    '<p>Start a real path through the stack.</p>' +
    '</div>' +
    `<div class="scenario-buttons">${buttons.join('')}</div>` +
    '</nav>'
  )
}

function renderPlaybackStatus(): string {
  // Compact playback status control adjacent to the rail. The action button is a
  // single native button that shows "Stop playback" while any scenario runs and an
  // explicit "Replay" invitation once the bounded tour pass has completed; it stays
  // hidden during the quiet idle/rest window. Step text derives from ScenarioState.
  return (
    '<nav class="playback-status" aria-labelledby="playback-status-title">' +
    '<h2 id="playback-status-title">Playback</h2>' +
    '<div class="playback-status__controls">' +
    '<button class="playback-status__action" id="playback-action" type="button" hidden>Stop playback</button>' +
    '<span class="playback-status__step" id="playback-step" hidden></span>' +
    '</div>' +
    '</nav>'
  )
}

function renderLegend(): string {
  // Entries derived from the distinct kinds on edges (not node kinds), filtered to
  // the canonical order so the key is deterministic regardless of data ordering.
  const presentKinds = new Set(topology.edges.map((edge) => edge.kind))
  const entries = LEGEND_KIND_ORDER.filter((kind) => presentKinds.has(kind)).map((kind) => (
    `<li class="legend-entry"><span class="legend-swatch legend-swatch--dash" style="--legend-flow: var(--flow-${kind})" aria-hidden="true"></span><span><strong>${esc(kindLabels[kind])}</strong><span class="legend-meaning">${esc(LEGEND_MEANING[kind])}</span></span></li>`
  ))
  return (
    '<section class="flow-legend" aria-labelledby="legend-title">' +
    '<div class="flow-legend__heading"><h2 id="legend-title">Flow key</h2></div>' +
    `<ul>${entries.join('')}</ul>` +
    '</section>'
  )
}

declare global {
  interface Window {
    homelabPacket: {
      start: (edgeId: string, flowKind: FlowKind, duration?: number, reverse?: boolean) => PacketHandle
      edges: typeof topology.edges
      scenarios: typeof scenarios
    }
  }
}

// Topology and scenario data live in load.ts, which throws at module scope. A static
// import would abort before any render code runs, so load the loaders behind a caught
// dynamic import() and replace #app with an accessible error on failure instead.
async function init(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app')!
  try {
    const data = await import('./data/load.ts')
    topology = data.topology
    scenarios = data.scenarios
    const readout = data.readout

    const layoutModule = await import('./layout.ts')
    const layout = layoutModule.layout
    nodeHeight = layoutModule.NODE_HEIGHT
    edgePath = layoutModule.edgePath
    getNodeRects = layoutModule.getNodeRects
    selectLayout = layoutModule.selectLayout

    // Scenario engine: initialised independently of the topology/data load above.
    // A failure here must NOT blow away the already-rendered diagram (unlike a
    // data/load.ts failure, which the outer catch turns into the error region). On
    // failure every play control is native-disabled below and these stubs keep the
    // rest of init inert — no tour, no progress, no listeners, no engine calls.
    let engineAvailable = false
    let getState: () => ScenarioState = () => ({
      scenarioId: null,
      running: false,
      caption: null,
      currentHop: null,
      completedHops: 0,
      totalHops: 0,
      arrival: null,
      participatingEdgeIds: EMPTY_PARTICIPATING,
    })
    let play: (id: string) => void = () => {}
    let stop: () => void = () => {}
    let subscribe: (listener: (state: ScenarioState) => void) => void = () => {}

    try {
      const engine = await import('./scenario.ts')
      getState = engine.getState
      play = engine.play
      stop = engine.stop
      subscribe = engine.subscribe
      engineAvailable = true
    } catch {
      // Engine module unavailable: keep the rendered topology/entries; disables set below.
    }

    dominantFlowById = new Map(scenarios.map((scenario) => [scenario.id, dominantFlowKind(scenario)]))

    firstNodeId = (() => {
      for (const zone of topology.zones) {
        const member = topology.nodes.find((node) => node.zone === zone.id)
        if (member) return member.id
      }
      return undefined
    })()

    // ---- previously-import-time code, now guarded behind the data load ----
    app.innerHTML =
      '<div class="interaction-shell">' +
      '<div class="topology-stage" id="topology-stage">' +
      '<p class="sr-only" id="topology-instructions">Topology nodes are interactive. Activate one to inspect its details.</p>' +
      renderTopology(layout) +
      // Caption/live regions stay associated with the stage; nesting here keeps the
      // shell a strict two-item grid (stage + control column) rather than a third item.
      '<p class="scenario-caption" id="scenario-caption" aria-live="polite" aria-atomic="true" hidden></p>' +
      '<p class="sr-only" id="scenario-arrival" aria-live="polite"></p>' +
      '</div>' +
      '<div class="control-column">' +
(scenarios.length === 0
         ? '<p class="empty-scenarios">No scenarios are defined.</p>'
         : renderScenarioRail()) +
       (scenarios.length > 0 ? renderPlaybackStatus() : '') +
       (scenarios.length > 0
         ? '<section class="path-readout" aria-labelledby="path-readout-title"><h2 id="path-readout-title"></h2><ol class="path-readout__list"></ol></section>'
         : '') +
      renderLegend() +
      '<aside class="inspector" id="node-inspector" role="region" aria-labelledby="inspector-title" aria-describedby="inspector-detail" hidden>' +
      '<div class="inspector__topline"><button class="inspector__close" id="inspector-close" type="button" aria-label="Close node inspector">Close</button></div>' +
      '<h2 id="inspector-title"></h2>' +
      '<div class="inspector__status" id="inspector-status" hidden>TRANSITIONAL NODE</div>' +
'<dl class="inspector__facts">' +
       '<div><dt>Zone</dt><dd id="inspector-zone"></dd></div>' +
       '<div><dt>Kind</dt><dd id="inspector-kind"></dd></div>' +
       '</dl>' +
       '<ul class="inspector__edges" id="inspector-edges" aria-label="Incident edges"></ul>' +
       '<p class="inspector__detail" id="inspector-detail"></p>' +
       '</aside>' +
      '</div>' +
      '</div>' +
      (scenarios.length === 0 ? '' : renderFlowsSection())

    const caption = document.querySelector<HTMLParagraphElement>('#scenario-caption')!
    const arrivalLive = document.querySelector<HTMLParagraphElement>('#scenario-arrival')!
    const scenarioNameById = new Map(scenarios.map((scenario) => [scenario.id, scenario.name]))
    const stage = document.querySelector<HTMLDivElement>('#topology-stage')!
    let renderedSvg = stage.querySelector<SVGSVGElement>('svg')!
    const renderedEdges = new Map<string, SVGPathElement>()
    // One g.edge-group per edge; focus dimming (opacity) applies to these, not the
    // packet-mutated path elements they wrap.
    const edgeGroups = new Map<string, SVGGElement>()
    const edgesById = new Map(topology.edges.map((edge) => [edge.id, edge]))
    const nodeById = new Map(topology.nodes.map((node) => [node.id, node]))
    const zoneById = new Map(topology.zones.map((zone) => [zone.id, zone]))
    const nodeControls = new Map<string, SVGGElement>()
    const inspector = document.querySelector<HTMLElement>('#node-inspector')!
    // The flow key carries no focusable element, so swapping it for the panel on open
    // cannot destroy focus; restore it on dismissal.
    const flowLegend = document.querySelector<HTMLElement>('.flow-legend')!
    const closeInspectorButton = document.querySelector<HTMLButtonElement>('#inspector-close')!
    const inspectorTitle = document.querySelector<HTMLHeadingElement>('#inspector-title')!
    const inspectorZone = document.querySelector<HTMLElement>('#inspector-zone')!
    const inspectorKind = document.querySelector<HTMLElement>('#inspector-kind')!
    const inspectorDetail = document.querySelector<HTMLParagraphElement>('#inspector-detail')!
    const inspectorStatus = document.querySelector<HTMLElement>('#inspector-status')!
    const inspectorEdges = document.querySelector<HTMLElement>('#inspector-edges')!
    const playbackAction = document.querySelector<HTMLButtonElement>('#playback-action')!
    const playbackStep = document.querySelector<HTMLElement>('#playback-step')!
    let invokingNode: SVGGElement | null = null
    let selectedNodeId: string | null = null

    // ---- Focus presentation ----
    // Which edges/nodes stay at full opacity; every other group dims. A node
    // selection beats playback: the node, its incident edges and adjacent nodes win,
    // so dimming is additive emphasis that never stops, pauses or restarts play.
    function resolveFocusSet(): { dimAll: boolean; edges: ReadonlySet<string>; nodes: Set<string> } {
      const selected = selectedNodeId
      if (selected) {
        const edges = new Set<string>()
        const nodes = new Set<string>([selected])
        for (const edge of topology.edges) {
          if (edge.from === selected || edge.to === selected) {
            edges.add(edge.id)
            nodes.add(edge.from)
            nodes.add(edge.to)
          }
        }
        return { dimAll: false, edges, nodes }
      }
      const state = getState()
      if (state.scenarioId !== null && state.running) {
        const participating = state.participatingEdgeIds
        const nodes = new Set<string>()
        for (const id of participating) {
          const edge = edgesById.get(id)
          if (edge) { nodes.add(edge.from); nodes.add(edge.to) }
        }
        return { dimAll: false, edges: participating, nodes }
      }
      // Idle or a completed run with nothing selected: no dimming at all.
      return { dimAll: true, edges: EMPTY_PARTICIPATING, nodes: EMPTY_PARTICIPATING }
    }

    // Apply the focus set as opacity on the dimmable wrappers only. Active groups are
    // pinned to "1" so transitions run between the two states, never partial ones.
    function applyFocusState(): void {
      const focus = resolveFocusSet()
      for (const [id, group] of edgeGroups) {
        group.setAttribute('opacity', focus.dimAll || focus.edges.has(id) ? '1' : 'var(--dim-inactive-edge)')
      }
      for (const [id, control] of nodeControls) {
        control.setAttribute('opacity', focus.dimAll || focus.nodes.has(id) ? '1' : 'var(--dim-inactive-node)')
      }
    }

    // Arrival pulses fire only on a control currently at full opacity, suppressing
    // them on dimmed (non-relevant) nodes under selection or playback.
    function nodeIsFullOpacity(nodeId: string): boolean {
      const focus = resolveFocusSet()
      return focus.dimAll || focus.nodes.has(nodeId)
    }

    // Path readout: the running/initial scenario's whole script shown in advance, one
    // row per hop in ascending `at` order, always declared from → to with a distinct
    // reverse indicator. Not a live region; the current step marks while running and
    // clears on completion. Initially shows the first scenario.
    let pathReadoutEl: HTMLElement | null = document.querySelector<HTMLElement>('.path-readout') ?? null
    let readoutScenarioId: string | null = null

    const labelOf = (nodeId: string): string => nodeById.get(nodeId)?.label ?? nodeId

    function renderPathRows(scenario: typeof scenarios[number]): void {
      const ordered = scenario.hops
        .map((hop, index) => ({ hop, index }))
        .sort((a, b) => a.hop.at - b.hop.at || a.index - b.index)
      const items = ordered.map(({ hop, index }) => {
        const edge = edgesById.get(hop.edge)
        const rowClass = hop.reverse ? 'path-readout__row path-readout__row--reverse' : 'path-readout__row'
        // Reverse keeps the declared from → to unchanged; a distinct ← cell (with an
        // accessible "reverse" label) marks travel against the declared direction.
        const reverseCell = hop.reverse
          ? `<span class="path-readout__reverse"><span aria-hidden="true">←</span><span class="sr-only">reverse</span></span>`
          : ''
        return (
          `<li class="${rowClass}" data-hop="${index}" style="--path-accent: var(--flow-${edge?.kind ?? 'control'})">` +
          `<span class="path-readout__stage path-readout__from">${esc(labelOf(edge?.from ?? ''))}</span>` +
          `<span class="path-readout__arrow" aria-hidden="true">→</span>` +
          `<span class="path-readout__stage path-readout__to">${esc(labelOf(edge?.to ?? ''))}</span>` +
          `${reverseCell}` +
          '</li>'
        )
      })
      const list = pathReadoutEl?.querySelector<HTMLElement>('.path-readout__list')
      const title = pathReadoutEl?.querySelector<HTMLHeadingElement>('#path-readout-title')
      if (!list || !title) return
      list.innerHTML = items.join('')
      title.textContent = scenario.name
    }

    function updateReadout(): void {
      const state = getState()
      const target = scenarios.find((scenario) => scenario.id === state.scenarioId) ?? scenarios[0]
      if (!target) return
      if (readoutScenarioId !== target.id) {
        readoutScenarioId = target.id
        renderPathRows(target)
      }
      const running = state.scenarioId !== null && state.running
      const currentHop = state.currentHop
      const rows = pathReadoutEl?.querySelectorAll<HTMLElement>('.path-readout__row')
      rows?.forEach((row) => {
        row.classList.toggle('path-readout__row--current', running && Number(row.dataset.hop) === currentHop)
      })
    }

    function indexRenderedTopology(): void {
      renderedEdges.clear()
      for (const path of renderedSvg.querySelectorAll<SVGPathElement>('path.edge')) renderedEdges.set(path.id, path)
      edgeGroups.clear()
      for (const group of renderedSvg.querySelectorAll<SVGGElement>('g.edge-group')) {
        if (group.dataset.edgeId) edgeGroups.set(group.dataset.edgeId, group)
      }
      nodeControls.clear()
      for (const node of renderedSvg.querySelectorAll<SVGGElement>('.node-control')) {
        if (node.dataset.nodeId) nodeControls.set(node.dataset.nodeId, node)
      }
    }

    function refreshTopology(stageWidth: number): void {
      const nextLayout = selectLayout(stageWidth)
      const nextTemplate = document.createElement('template')
      nextTemplate.innerHTML = renderTopology(nextLayout)
      const nextSvg = nextTemplate.content.firstElementChild as SVGSVGElement
      renderedSvg.setAttribute('viewBox', nextSvg.getAttribute('viewBox')!)

      for (const nextZone of nextSvg.querySelectorAll<SVGRectElement>('[data-zone-id]')) {
        const zone = renderedSvg.querySelector<SVGRectElement>(`[data-zone-id="${nextZone.dataset.zoneId}"]`)
        if (!zone) continue
        for (const attribute of ['x', 'y', 'width', 'height']) zone.setAttribute(attribute, nextZone.getAttribute(attribute)!)
      }
      for (const nextLabel of nextSvg.querySelectorAll<SVGTextElement>('[data-zone-label], [data-zone-sub]')) {
        const selector = nextLabel.dataset.zoneLabel
          ? `[data-zone-label="${nextLabel.dataset.zoneLabel}"]`
          : `[data-zone-sub="${nextLabel.dataset.zoneSub}"]`
        const label = renderedSvg.querySelector<SVGTextElement>(selector)
        if (label) {
          label.setAttribute('x', nextLabel.getAttribute('x')!)
          label.setAttribute('y', nextLabel.getAttribute('y')!)
        }
      }
      for (const nextEdge of nextSvg.querySelectorAll<SVGPathElement>('path.edge')) {
        renderedSvg.getElementById(nextEdge.id)?.setAttribute('d', nextEdge.getAttribute('d')!)
      }
      for (const nextGlow of nextSvg.querySelectorAll<SVGPathElement>('path.edge-glow')) {
        renderedSvg.querySelector(`.edge-glow[data-edge-id="${nextGlow.dataset.edgeId}"]`)?.setAttribute('d', nextGlow.getAttribute('d')!)
      }
      for (const nextNode of nextSvg.querySelectorAll<SVGGElement>('.node-control')) {
        const node = renderedSvg.querySelector<SVGGElement>(`.node-control[data-node-id="${nextNode.dataset.nodeId}"]`)
        const nextBox = nextNode.querySelector<SVGRectElement>('rect.node-box')
        const nextAccent = nextNode.querySelector<SVGRectElement>('rect.node-accent')
        const nextText = nextNode.querySelector<SVGTextElement>('text')
        const box = node?.querySelector<SVGRectElement>('rect.node-box')
        const accent = node?.querySelector<SVGRectElement>('rect.node-accent')
        const text = node?.querySelector<SVGTextElement>('text')
        if (box && nextBox) for (const attribute of ['x', 'y', 'width', 'height']) box.setAttribute(attribute, nextBox.getAttribute(attribute)!)
        if (accent && nextAccent) for (const attribute of ['x', 'y']) accent.setAttribute(attribute, nextAccent.getAttribute(attribute)!)
        if (text && nextText) for (const attribute of ['x', 'y']) text.setAttribute(attribute, nextText.getAttribute(attribute)!)
      }
      indexRenderedTopology()
      if (selectedNodeId) nodeControls.get(selectedNodeId)?.setAttribute('data-selected', 'true')
      if (invokingNode?.dataset.nodeId) invokingNode = nodeControls.get(invokingNode.dataset.nodeId) ?? null
      // Edge strings just changed during re-layout; refresh live packets' offset-path to track them.
      refreshPacketPaths()
      // Groups were re-indexed; keep dimming consistent with the current selection/playback.
      applyFocusState()
    }

    indexRenderedTopology()

    // Scenario engine failed to initialise: mark every play control native-disabled so
    // it drops out of tab order and swallows clicks. CSS supplies the 50% opacity. This
    // state means "cannot run", never "running" — the running path keeps classes +
    // data-running + aria-pressed only (see renderProgress).
    if (!engineAvailable) {
      for (const button of document.querySelectorAll<HTMLButtonElement>('.scenario-button, .flow-row__play')) {
        button.disabled = true
      }
    }

    window.homelabPacket = {
      start(edgeId: string, flowKind: FlowKind, duration = 1000, reverse = false) {
        const edge = edgesById.get(edgeId)
        if (!edge || !renderedEdges.has(edgeId)) throw new Error(`unknown rendered edge: ${edgeId}`)
        return animatePacket(edge.id, flowKind, duration, reverse)
      },
      edges: topology.edges,
      scenarios,
    }

    function openInspector(nodeId: string, trigger: SVGGElement): void {
      const node = nodeById.get(nodeId)
      if (!node) return
      const zone = zoneById.get(node.zone)
      if (!zone) return

      if (selectedNodeId) nodeControls.get(selectedNodeId)?.removeAttribute('data-selected')
      selectedNodeId = node.id
      invokingNode = trigger
      trigger.setAttribute('data-selected', 'true')
      inspectorTitle.textContent = node.label
      inspectorZone.textContent = zone.label
      inspectorKind.textContent = kindLabels[node.kind]
inspectorDetail.textContent = node.detail
       inspectorStatus.hidden = !node.transitional
       // Selected-node context: derive the connected endpoint/kind cue from the graph so
       // the meaning of each incident edge is readable text beside kind. No new data;
       // direction stays declared by the edge, this only labels the connection.
       inspectorEdges.innerHTML = topology.edges
         .filter((edge) => edge.from === node.id || edge.to === node.id)
         .map((edge) => {
           const from = nodeById.get(edge.from)?.label ?? edge.from
           const to = nodeById.get(edge.to)?.label ?? edge.to
           const arrow = edge.bidirectional ? '↔' : '→'
           return `<li>${esc(from)} ${arrow} ${esc(to)} <span class="inspector__edges-kind">(${kindLabels[edge.kind]} flow)</span></li>`
         })
         .join('')
       inspector.hidden = false
      flowLegend.hidden = true
      // A node selection permanently disarms the idle tour for the session and dims
      // everything else to it. It never calls stop/restart — a running scenario stays
      // running; selection simply overrides which edges/nodes stay lit.
      tourSessionOpen = false
      disarmTourTimer()
      applyFocusState()
    }

    function closeInspector(): void {
      if (inspector.hidden) return
      inspector.hidden = true
      flowLegend.hidden = false
nodeControls.get(selectedNodeId ?? '')?.removeAttribute('data-selected')
       selectedNodeId = null
       inspectorEdges.innerHTML = ''
      const returnTarget = invokingNode
      invokingNode = null
      // Hand the lone roving tabindex back to the node focus returns to, resetting
      // whichever node had it before opening. The fallback (responsive rerender may
      // have dropped the invoker) keeps markup's first-node default of tabindex=0.
      const previousRoving = [...nodeControls.values()].find((control) => control.getAttribute('tabindex') === '0')
      const fallback = renderedSvg.querySelector<SVGGElement>('.node-control')
      const target = (returnTarget?.isConnected ? returnTarget : fallback) ?? null
      previousRoving?.setAttribute('tabindex', '-1')
      target?.setAttribute('tabindex', '0')
      target?.focus({ preventScroll: true })
      // Dismissing the selection restores playback focus (if running) or full opacity.
      applyFocusState()
    }

    stage.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return
      const node = event.target.closest<SVGGElement>('.node-control')
      if (node?.dataset.nodeId) openInspector(node.dataset.nodeId, node)
    })

    // Roaming nodes document-order style: move the sole tabindex=0 together with
    // focus (no wrapping), Enter/Space still opens the inspector. Bound to the stage
    // so only nodes reach it; scenario rail/Flows buttons are never under here.
    function moveToNode(target: SVGGElement): void {
      const current = [...nodeControls.values()].find((control) => control.getAttribute('tabindex') === '0')
      if (current) current.setAttribute('tabindex', '-1')
      target.setAttribute('tabindex', '0')
      target.focus({ preventScroll: true })
    }

    stage.addEventListener('keydown', (event) => {
      if (!(event.target instanceof Element)) return
      if (event.key === 'Escape' && !inspector.hidden) {
        event.preventDefault()
        closeInspector()
        return
      }
      const node = event.target.closest<SVGGElement>('.node-control')
      if (!node?.dataset.nodeId) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openInspector(node.dataset.nodeId, node)
        return
      }

      if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'Home' ||
        event.key === 'End'
      ) {
        event.preventDefault()
        const controls = [...nodeControls.values()]
        const currentIndex = controls.indexOf(node)
        if (currentIndex === -1) return
        let targetIndex: number
        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            targetIndex = currentIndex + 1
            break
          case 'ArrowLeft':
          case 'ArrowUp':
            targetIndex = currentIndex - 1
            break
          case 'Home':
            targetIndex = 0
            break
          default: // End
            targetIndex = controls.length - 1
            break
        }
        // No wrapping at either end.
        if (targetIndex < 0 || targetIndex >= controls.length) return
        moveToNode(controls[targetIndex])
      }
    })

    // Every play control for a scenario — rail + Flows rows — grouped by id so the
    // single progress/status write-back touches both at once. Built from both button
    // kinds so duplicate ids resolve to a list, not one collapsed button.
    const buttonsByScenario = new Map<string, HTMLButtonElement[]>()
    const allPlayButtons = document.querySelectorAll<HTMLButtonElement>('.scenario-button, .flow-row__play')
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    for (const button of allPlayButtons) {
      const id = button.dataset.scenarioId!
      let list = buttonsByScenario.get(id)
      if (!list) {
        list = []
        buttonsByScenario.set(id, list)
      }
      list.push(button)
    }

    // Exactly one click handler per button. Rail starts immediately; Flows rows
    // scroll the stage into view first, then start — both feed the same engine.
    for (const button of allPlayButtons) {
      const id = button.dataset.scenarioId!
      button.addEventListener('click', () => {
        if (button.classList.contains('flow-row__play')) {
          stage.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' })
        }
        play(id)
      })
    }

    // The left-edge accent lives on each article; mirroring data-running onto it lets
    // CSS brighten the accent when its scenario runs.
    const flowsRowById = new Map<string, HTMLElement>()
    for (const article of document.querySelectorAll<HTMLElement>('.flow-row')) {
      const button = article.querySelector<HTMLButtonElement>('.flow-row__play')
      if (button?.dataset.scenarioId) flowsRowById.set(button.dataset.scenarioId, article)
    }

    closeInspectorButton.addEventListener('click', closeInspector)
    inspector.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeInspector()
        return
      }
    })

    let lastStageWidth = Math.round(stage.getBoundingClientRect().width)
    if (lastStageWidth > 0 && lastStageWidth < layout.viewBox.width) refreshTopology(lastStageWidth)
    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      if (width <= 0 || width === lastStageWidth) return
      lastStageWidth = width
      refreshTopology(width)
    })
    resizeObserver.observe(stage)

    // ---- Running progress ----
    // Total duration is derivable from the hop array (max of at + duration); no
    // dedicated per-scenario duration state is kept. Progress resets on stop.
    function scenarioTotalDuration(scenarioId: string): number {
      const scenario = scenarios.find((candidate) => candidate.id === scenarioId)
      if (!scenario) return 0
      return Math.max(0, ...scenario.hops.map((hop) => hop.at + hop.duration))
    }

    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let progressRaf: number | undefined
    let progressId: string | null = null
    let progressStart = 0

    // A single RAF loop animates the smooth bar for the running scenario, keyed by
    // progressId. Cancelling leaves progressId intact so resuming after a reduced
    // toggle rebuilds the same loop instead of spawning a second one.
    function cancelRaf(): void {
      if (progressRaf !== undefined) {
        cancelAnimationFrame(progressRaf)
        progressRaf = undefined
      }
    }

    // Point the loop at `id`, reusing its existing start unless this is a resume
    // from a held reduced marker — in which case shift the start back so the smooth
    // bar meets the discrete completedHops fraction rather than jumping from zero.
    function settleRafFor(id: string): void {
      const reconnecting = progressRaf === undefined && progressId === id
      if (progressId !== id || reconnecting) {
        progressId = id
        const { scenarioId, running, completedHops, totalHops } = getState()
        const fraction = scenarioId === id && running && totalHops > 0
          ? Math.min(1, completedHops / totalHops)
          : 0
        progressStart = performance.now() - fraction * scenarioTotalDuration(id)
      }
      if (progressRaf === undefined) progressRaf = requestAnimationFrame(tickProgress)
    }

    function tickProgress(): void {
      if (progressId === null) return
      const total = scenarioTotalDuration(progressId)
      const elapsed = Math.min(Math.max(0, performance.now() - progressStart), total)
      const buttons = buttonsByScenario.get(progressId)
      if (buttons?.length && total > 0) {
        const percent = `${(elapsed / total) * 100}%`
        for (const button of buttons) button.style.setProperty('--scenario-progress', percent)
        announceStatus(progressId, Math.round(Math.min(1, elapsed / total) * 100))
      }
      progressRaf = requestAnimationFrame(tickProgress)
    }

    // Accessible "Running — N%" status text, keyed per scenario by integer percent so
    // it updates only when the rounded percentage actually changes: coalescing the
    // continuous RAF into discrete announcements (including the initial 0 and the
    // terminal 100) rather than spamming assistive tech every frame. Cleared for
    // buttons that leave the active scenario. Announced once per id across all its
    // buttons so rail and Flows never double-announce.
    let lastStatusPct = new Map<string, number>()

    function announceStatus(id: string, intPct: number): void {
      if (lastStatusPct.get(id) === intPct) return
      lastStatusPct.set(id, intPct)
      buttonsByScenario.get(id)?.forEach((button) => {
        const status = button.querySelector<HTMLElement>('.scenario-button__status')
        if (status) status.textContent = `Running — ${intPct}%`
      })
    }

    function forgetStatus(id: string): void {
      if (lastStatusPct.delete(id)) {
        buttonsByScenario.get(id)?.forEach((button) => {
          const status = button.querySelector<HTMLElement>('.scenario-button__status')
          if (status) status.removeAttribute('data-pct')
        })
      }
    }

    // Render caption, running indicator, accessible state, and per-button progress
    // together on every state change (initial idle included). The single RAF is owned
    // by the one active scenario; its progress/status/write-back hits every matching
    // button (rail + Flows rows) at once via buttonsByScenario. Terminal completed
    // holds 100% until the next run/stop.
    function renderProgress(): void {
      const { scenarioId, running, totalHops, completedHops } = getState()
      const terminal = scenarioId !== null && !running && totalHops > 0 && completedHops === totalHops

      for (const [id, buttons] of buttonsByScenario) {
        const active = scenarioId === id
        const playing = active && running
        const name = scenarioNameById.get(id) ?? ''
        const row = flowsRowById.get(id)
        if (row) row.setAttribute('data-running', String(playing))

        for (const button of buttons) {
          button.classList.toggle('scenario-button--running', playing)
          button.setAttribute('data-running', String(playing))
          button.setAttribute('aria-pressed', String(playing))
          const action = playing ? 'Playing' : 'Play'
          if (button.classList.contains('scenario-button')) {
            button.removeAttribute('aria-label')
          } else {
            button.setAttribute('aria-label', `${action} ${name} scenario`)
          }
        }

        for (const button of buttons) {
          const status = button.querySelector<HTMLElement>('.scenario-button__status')
          if (status) status.hidden = !active
        }

        if (!active) {
          forgetStatus(id)
          if (scenarioId === null) cancelRaf()
          for (const button of buttons) button.style.removeProperty('--scenario-progress')
          continue
        }

        // Defensive: an active owner implies a real scenarioId.
        if (scenarioId === null) {
          cancelRaf()
          for (const button of buttons) button.style.removeProperty('--scenario-progress')
          continue
        }

        if (terminal) {
          cancelRaf()
          for (const button of buttons) button.style.setProperty('--scenario-progress', '100%')
          announceStatus(id, 100)
          continue
        }

        if (reducedQuery.matches) {
          cancelRaf()
          const fraction = totalHops > 0 ? Math.min(1, completedHops / totalHops) : 0
          const pct = Math.round(fraction * 100)
          for (const button of buttons) button.style.setProperty('--scenario-progress', `${fraction * 100}%`)
          announceStatus(id, pct)
          continue
        }

        // Smooth bar: settle/resume the single owned RAF. TickProgress keeps the
        // accessible status in step, coalesced by integer percent.
        announceStatus(id, 0)
        settleRafFor(id)
      }
    }

    // Caption reflects the engine state on every change, including initial idle.
    subscribe(() => {
      caption.textContent = getState().caption ?? ''
      caption.hidden = getState().caption === null
      renderProgress()
      // Selection/playback focus changes and the path-readout current step only shift
      // at these state boundaries, so recompute both here.
      applyFocusState()
      updateReadout()
    })

    // ---- Arrival pulses ----
    // The engine publishes the completion destination; we pulse that node's border
    // in the packet's flow colour. WAAPI owns each pulse's lifetime — no timers.
    const ARRIVAL_DURATION = 400
    const ARRIVAL_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
    let flowColors: Partial<Record<FlowKind, string>> = {}
    let ruleStroke = ''
    // Per-node pulse bookkeeping. Storing the triggering arrival lets a motion
    // toggle re-render the same pulse in whatever mode is now active.
    const activePulses = new Map<string, { animation: Animation; arrival: Arrival }>()

    function flowColour(kind: FlowKind): string {
      if (!ruleStroke) ruleStroke = getComputedStyle(document.documentElement).getPropertyValue('--rule').trim()
      return flowColors[kind] ??= getComputedStyle(document.documentElement).getPropertyValue(`--flow-${kind}`).trim()
    }

    // Each new arrival cancels and restarts the destination's pulse so concurrent
    // arrivals never stack. Normal easing draws a border-width trip; reduced motion
    // holds the flow colour at fixed width briefly, then fades to the rule stroke.
    function emitArrivalPulse(arrival: Arrival): void {
      // Only pulse a control at full opacity; arrivals landing on dimmed (non-relevant)
      // nodes during selection or playback are suppressed.
      if (!nodeIsFullOpacity(arrival.nodeId)) return
      const box = nodeControls.get(arrival.nodeId)?.querySelector<SVGRectElement>('rect.node-box')
      if (!box) return
      const colour = flowColour(arrival.flowKind)
      activePulses.get(arrival.nodeId)?.animation.cancel()

      const release = (animation: Animation): void => {
        if (activePulses.get(arrival.nodeId)?.animation === animation) {
          activePulses.delete(arrival.nodeId)
          box.style.removeProperty('stroke')
          box.style.removeProperty('stroke-width')
        }
      }

      let animation: Animation
      if (reducedQuery.matches) {
        box.style.setProperty('stroke', colour)
        const hold = 400
        const fade = 200
        animation = box.animate(
          [
            { stroke: colour, offset: 0 },
            { stroke: colour, offset: hold / (hold + fade) },
            { stroke: ruleStroke, offset: 1 },
          ],
          { duration: hold + fade, easing: 'ease', fill: 'backwards' }
        )
      } else {
        animation = box.animate(
          [
            { strokeWidth: 1.5, stroke: colour },
            { strokeWidth: 3, stroke: colour },
            { strokeWidth: 1.5, stroke: colour },
          ],
          { duration: ARRIVAL_DURATION, easing: ARRIVAL_EASING, fill: 'backwards' }
        )
      }
      animation.onfinish = () => release(animation)
      animation.oncancel = () => release(animation)
      activePulses.set(arrival.nodeId, { animation, arrival })
    }

    // A motion preference change must re-render whatever pulses are in flight in the
    // new mode: cancel each live pulse and re-issue it (normal <-> reduced), no timers.
    function reapplyActivePulses(): void {
      if (activePulses.size === 0) return
      const pending = [...activePulses.entries()]
      for (const [, pulse] of pending) pulse.animation.cancel()
      activePulses.clear()
      for (const [, pulse] of pending) emitArrivalPulse(pulse.arrival)
    }

    // ---- Idle tour ----
    // Bounded, data-order invitation pass only: one pass through scenarios.json order
    // (indices 0..n) after a single 2500ms idle delay, then hold in a stable
    // idle/completed state with an explicit Replay invitation. There is no rest-and-loop.
    // Reduced motion never starts the pass. tourScenarioId names the scenario the tour
    // owns (set right before a tour play()); manual/programmatic runs close the session
    // so they never drive the tour. tourStarted marks that an automatic pass has begun
    // this session, so reduced-motion lifts cannot silently relaunch a completed pass;
    // only the explicit Replay gesture restarts playback.
    const INITIAL_DELAY_MS = 2500
    const REST_MS = 3000
    let tourTimer: number | undefined
    let tourSessionOpen = true
    let tourStarted = false
    let tourIndex = 0
    let tourScenarioId: string | null = null
    let replayApplicable = false

    function disarmTourTimer(): void {
      if (tourTimer !== undefined) {
        window.clearTimeout(tourTimer)
        tourTimer = undefined
      }
    }

    // True only while the tour itself is running — i.e. the active scenario is the
    // one the tour handed out. Manual/programmatic runs do not count, so stop and
    // reduced-motion cancellation only ever interrupt the tour's own playback.
    function isTourOwnedRunning(): boolean {
      return tourScenarioId !== null && getState().running && getState().scenarioId === tourScenarioId
    }

    // A genuine interaction ends the session tour for the remainder of the session
    // and cancels any tour-owned playback. Manual play still follows from the same
    // control (a button click plays); programmatic tour play fires no event here.
    function onUserInteraction(event: Event): void {
      disarmTourTimer()
      // Node-control interactions (pointer/keyboard/click on a node) close the idle
      // session and clear ownership so the pass can never resume, but they
      // must NOT stop the active scenario — selection dims edges/nodes, it does not
      // pause or restart playback. Everything else keeps the existing stop-tour path.
      const node = event.target instanceof Element
        ? event.target.closest<SVGGElement>('.node-control')
        : null
      if (node?.dataset.nodeId) {
        tourSessionOpen = false
        tourScenarioId = null
        return
      }
      tourSessionOpen = false
      if (isTourOwnedRunning()) stop()
    }

    function armInitialDelay(): void {
      disarmTourTimer()
      // No scenarios / already launched / reduced motion: never start a second pass.
      if (scenarios.length === 0 || tourStarted || reducedQuery.matches) return
      tourStarted = true
      tourTimer = window.setTimeout(() => {
        tourTimer = undefined
        play(scenarios[tourIndex].id)
        // Assign ownership AFTER play(): play()'s internal stop() emits an idle
        // state whose synchronous subscriber otherwise clears tourScenarioId before
        // this line runs, leaving the launched scenario unowned and stalling the pass.
        tourScenarioId = scenarios[tourIndex].id
        tourIndex += 1
      }, INITIAL_DELAY_MS)
    }

    // Restart the whole pass for an explicit Replay action (not an automatic relaunch —
    // it deliberately bypasses tourStarted because it is a direct user gesture). After
    // it the same bounds apply again: one ordered pass, then an explicit Replay invite.
    function beginPass(): void {
      disarmTourTimer()
      replayApplicable = false
      tourSessionOpen = true
      tourIndex = 0
      // Play assigns the engine's scenarioId; assign ownership AFTER so a stop()-emitted
      // idle state inside play() cannot clear it before this assignment takes effect.
      play(scenarios[0].id)
      tourScenarioId = scenarios[0].id
      tourIndex = 1
    }

    // Reflect engine state onto the standalone playback-status control: "Stop playback"
    // while any scenario runs (manual or tour), an explicit "Replay" once the bounded
    // pass completed, nothing during the quiet idle/rest window. Step N of M derives
    // from ScenarioState and is shown as visible display text only — not a live region,
    // so announcements stay bounded to start/completion. data-running mirrors every
    // other play control so the stopped-state CSS hook applies here too.
    function updatePlaybackStatus(): void {
      const { running, totalHops, completedHops } = getState()
      if (running) {
        playbackAction.hidden = false
        playbackAction.textContent = 'Stop playback'
        playbackAction.setAttribute('aria-pressed', 'true')
        playbackAction.dataset.running = 'true'
        if (totalHops > 0) {
          playbackStep.hidden = false
          playbackStep.textContent = `Step ${Math.min(completedHops, totalHops)} of ${totalHops}`
        } else {
          playbackStep.hidden = true
        }
        return
      }
      if (replayApplicable) {
        playbackAction.hidden = false
        playbackAction.textContent = 'Replay'
        playbackAction.setAttribute('aria-pressed', 'false')
        playbackAction.dataset.running = 'false'
        playbackStep.hidden = true
        return
      }
      // Quiet idle/stop/explicit-rest: explicitly reset the shared stopped-state hooks
      // before hiding so a stopped control (e.g. post-Stop) reads "stopped", never
      // retains stale running attrs. Step stays hidden here too.
      playbackAction.dataset.running = 'false'
      playbackAction.setAttribute('aria-pressed', 'false')
      playbackAction.hidden = true
      playbackStep.hidden = true
    }

    // Native Stop / Replay control for the bounded pass. Route cancellation through the
    // existing engine stop() (clears packets, glow, pulses, progress); manual scenario
    // buttons stay enabled throughout. A completed pass invites an explicit Replay.
    playbackAction.addEventListener('click', () => {
      const state = getState()
      if (state.running) {
        disarmTourTimer()
        replayApplicable = false
        tourSessionOpen = false
        stop()
      } else if (replayApplicable) {
        beginPass()
      }
    })

    // Publishes arrivals and advances the tour: a tour-owned scenario completion
    // (session still open) plays the next scenario in data order at most once; once the
    // pass is exhausted it holds in a stable completed/idle state and invites explicit
    // Replay instead of looping. Manual completion does not advance. On idle/stop
    // lingering pulses reconcile to CSS.
    let prevStateRunning = false
    subscribe(({ arrival, scenarioId, running }) => {
      if (arrival) {
        emitArrivalPulse(arrival)
      }

      if (!running && scenarioId === null) {
        tourScenarioId = null
        for (const pulse of activePulses.values()) pulse.animation.cancel()
        activePulses.clear()
        nodeControls.forEach((control) => {
          control.querySelector<SVGRectElement>('rect.node-box')?.style.removeProperty('stroke')
          control.querySelector<SVGRectElement>('rect.node-box')?.style.removeProperty('stroke-width')
        })
        prevStateRunning = false
        updatePlaybackStatus()
        return
      }

      // Boundary announcements: rising into running names the scenario started,
      // falling back to idle within a named scenario names it complete. The idle/stop
      // branch above returns early, so a stop never produces an extra announcement.
      if (running && !prevStateRunning && scenarioId != null) {
        arrivalLive.textContent = `${scenarioNameById.get(scenarioId)} scenario started`
      } else if (!running && prevStateRunning && scenarioId != null) {
        arrivalLive.textContent = `${scenarioNameById.get(scenarioId)} scenario complete`
      }
      prevStateRunning = running

      // Advance the pass only for a tour-owned terminal scenario, guarded by
      // interaction-safety (session open) and reduced motion, which blocks the tour.
      if (!running && scenarioId !== null && tourScenarioId === scenarioId && tourSessionOpen && !reducedQuery.matches) {
        tourScenarioId = null
        disarmTourTimer()
        if (tourIndex < scenarios.length) {
          const nextScenarioId = scenarios[tourIndex].id
          tourTimer = window.setTimeout(() => {
            tourTimer = undefined
            play(nextScenarioId)
            // Assign ownership AFTER play(): play()'s stop() emits idle, and its
            // subscriber clears tourScenarioId before this line runs — leaving the
            // launched scenario unowned would stall the pass after one transition.
            tourScenarioId = nextScenarioId
            tourIndex += 1
          }, REST_MS)
        } else {
          // Pass exhausted: stable completed/idle; only explicit Replay restarts.
          replayApplicable = true
        }
      }
      updatePlaybackStatus()
    })

    // Reduced-motion packets: packet.ts always starts a Web Animation so hop timing
    // and cleanup stay deterministic, but CSS hides .packet under
    // prefers-reduced-motion, leaving a running animation nobody sees. While reduced
    // mode matches, observe the rendered SVG for new circle.packet nodes and cancel
    // each one's animation immediately — its promise finalizes (edge highlight + fade
    // cleanup proceed) with no travelling frame left behind. Disconnected the moment
    // reduced mode leaves; survives re-layout because renderedSvg is only mutated in
    // place, never replaced.
    const reducedPacketSelector = 'circle.packet'
    let packetObserver: MutationObserver | undefined

    function startReducedMotionPacketObserver(): void {
      // The observer only reports insertions after observation begins, so cancel any
      // packet already present when reduced mode turned on here too.
      renderedSvg.querySelectorAll<SVGCircleElement>(reducedPacketSelector).forEach((packet) => {
        packet.getAnimations().forEach((animation) => animation.cancel())
      })
      packetObserver ??= new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node instanceof SVGCircleElement && node.classList.contains('packet')) {
              node.getAnimations().forEach((animation) => animation.cancel())
            }
          }
        }
      })
      packetObserver.observe(renderedSvg, { subtree: true, childList: true })
    }

    function stopReducedMotionPacketObserver(): void {
      packetObserver?.disconnect()
      packetObserver = undefined
    }

    // Reduced motion blocks the tour entirely: never start it, cancel an in-flight
    // tour-owned playback immediately, and re-arm a fresh idle delay when the
    // preference lifts and the session remains open. Pulses and progress reconcile to
    // the new mode on the same change.
    reducedQuery.addEventListener('change', (event) => {
      if (!engineAvailable) return
      renderProgress()
      reapplyActivePulses()
      if (event.matches) {
        disarmTourTimer()
        if (isTourOwnedRunning()) stop()
        startReducedMotionPacketObserver()
      } else {
        stopReducedMotionPacketObserver()
        // Lifting reduced motion may re-arm one fresh pass; never relaunch an already
        // completed one, so only when the automatic pass has not yet begun this session.
        if (tourSessionOpen && !tourStarted) {
          tourIndex = 0
          replayApplicable = false
          armInitialDelay()
        }
      }
    })

    // Reduced motion may already match at load; connect the observer up front so
    // packets created later this session are cancelled like those from a mid-run toggle.
    if (reducedQuery.matches) startReducedMotionPacketObserver()

    // Capture gestures/keys as session-ending before other handlers run, so a future
    // play control also counts as interaction. window-level capture runs ahead of the
    // scenario-button click and node handlers registered earlier.
    window.addEventListener('pointerdown', onUserInteraction, true)
    window.addEventListener('keydown', onUserInteraction, true)
    window.addEventListener('click', onUserInteraction, true)

    // Instrument status line: node count from topology + the small readout payload.
    // Overwrites the static index placeholder so nothing here hardcodes metrics.
    function renderHeroReadout(): void {
      const parts = [
        `nodes ${topology.nodes.length}`,
        `resident models ${readout.residentModels}`,
        `briefing ${readout.briefingTime}`,
        `qwen ${readout.primaryThroughput}`,
      ]
      document.querySelector<HTMLParagraphElement>('#hero-readout')!.textContent = parts.join(' · ')
    }

    if (engineAvailable) armInitialDelay()
    renderHeroReadout()
  } catch (err) {
    const brokenId = brokenIdFromError(err)
    app.innerHTML =
      `<section class="stage-error" role="alert" aria-label="Failed to load the topology">` +
      `<p class="stage-error__message">Could not load the topology: <strong>${esc(brokenId)}</strong>. ` +
      `Verify the topology data contains that id, or <a href="https://github.com/njvenis/homelab-showcase">View the source on GitHub</a>.</p>` +
      '</section>'
  }
}

init()
