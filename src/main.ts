import './style.css'
import { scenarios, topology } from './data/load.ts'
import { edgePath, getNodeRects, layout, NODE_HEIGHT, type NodeRect } from './layout.ts'
import { animatePacket, type PacketHandle } from './packet.ts'
import { play, subscribe } from './scenario.ts'
import type { FlowKind } from './types.ts'

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

const legendEntries = [
  { variable: '--flow-control', label: 'Control', meaning: 'orchestration and commands' },
  { variable: '--flow-memory', label: 'Memory', meaning: 'reads and writes' },
  { variable: '--flow-infer', label: 'Inference', meaning: 'model work' },
  { variable: '--flow-health', label: 'Health', meaning: 'checks and telemetry' },
  { variable: '--flow-egress', label: 'Egress', meaning: 'outbound delivery' },
] as const

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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

function renderTopology(): string {
  const { width, height } = layout.viewBox

  const zoneEls = topology.zones.map((zone) => {
    const r = layout.zones[zone.id as keyof typeof layout.zones]
    if (!r) throw new Error(`no layout for zone: ${zone.id}`)
    const sub = zone.sub
      ? `<text class="zone-sub" x="${r.x + r.padding}" y="${r.y + r.padding + 22}">${esc(zone.sub)}</text>`
      : ''
    return (
      `<rect class="zone" x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="${ZONE_RX}"/>` +
      `<text class="zone-label" x="${r.x + r.padding}" y="${r.y + r.padding}">${esc(zone.label)}</text>` +
      sub
    )
  })

  const nodeRects = new Map<string, NodeRect>()
  topology.zones.forEach((zone) => {
    for (const [id, rect] of getNodeRects(zone.id)) nodeRects.set(id, rect)
  })

  const markerDefs = '<defs><marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><polygon class="edge-marker" points="0,0 9,5 0,10"/></marker></defs>'

  const edgeEls = topology.edges.map((edge) => {
    const from = nodeRects.get(edge.from)!
    const to = nodeRects.get(edge.to)!
    const markers = edge.bidirectional
      ? 'marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"'
      : 'marker-end="url(#arrowhead)"'
    return `<path class="edge" id="${esc(edge.id)}" d="${edgePath(from, to)}" ${markers}/>`
  })

  const nodeEls = topology.zones.flatMap((zone) => {
    return topology.nodes.filter((node) => node.zone === zone.id).map((node) => {
      const rect = nodeRects.get(node.id)!
      const centerX = rect.x + rect.width / 2
      const centerY = rect.y + rect.height / 2
      const transitionalClass = node.transitional ? ' node--transitional' : ''
      const zoneLabel = topology.zones.find((candidate) => candidate.id === node.zone)?.label ?? node.zone
      return (
        `<g class="node-control" data-node-id="${esc(node.id)}" role="button" tabindex="0" focusable="true" aria-label="Inspect ${esc(node.label)} in ${esc(zoneLabel)}">` +
        `<rect class="node-box${transitionalClass}" x="${rect.x.toFixed(1)}" y="${rect.y.toFixed(1)}" width="${rect.width.toFixed(1)}" height="${NODE_HEIGHT}" rx="${NODE_RX}"/>` +
        `<text class="node-label" x="${centerX.toFixed(1)}" y="${(centerY + 4).toFixed(1)}">${esc(node.label)}</text>` +
        '</g>'
      )
    })
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="group" aria-labelledby="topology-title" aria-describedby="topology-desc"><title id="topology-title">Homelab stack topology</title><desc id="topology-desc">${esc(topologyDescription())}</desc>${markerDefs}${zoneEls.join('')}${edgeEls.join('')}${nodeEls.join('')}</svg>`
}

function renderScenarioRail(): string {
  const buttons = scenarios.map((scenario) => (
    `<button class="scenario-button" type="button" data-scenario-id="${esc(scenario.id)}" aria-label="Play ${esc(scenario.name)} scenario">` +
    `<span class="scenario-button__name">${esc(scenario.name)}</span>` +
    `<span class="scenario-button__status" aria-hidden="true" hidden>Running</span>` +
    '</button>'
  ))
  return (
    '<nav class="scenario-rail" aria-labelledby="scenario-title">' +
    '<div class="scenario-rail__intro">' +
    '<span class="section-kicker">SCRIPTED FLOWS</span>' +
    '<h2 id="scenario-title">Follow a scenario</h2>' +
    '<p>Start a real path through the stack.</p>' +
    '</div>' +
    `<div class="scenario-buttons">${buttons.join('')}</div>` +
    '</nav>'
  )
}

function renderLegend(): string {
  const entries = legendEntries.map(({ variable, label, meaning }) => (
    `<li class="legend-entry"><span class="legend-swatch" style="--legend-flow: var(${variable})" aria-hidden="true"></span><span><strong>${label}</strong><span class="legend-meaning">${meaning}</span></span></li>`
  ))
  return (
    '<section class="flow-legend" aria-labelledby="legend-title">' +
    '<div class="flow-legend__heading"><span class="section-kicker">FLOW KEY</span><h2 id="legend-title">What the lines mean</h2></div>' +
    `<ul>${entries.join('')}</ul>` +
    '</section>'
  )
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML =
  '<div class="interaction-shell">' +
  '<p class="sr-only" id="topology-instructions">Topology nodes are interactive. Activate one to inspect its details.</p>' +
  renderScenarioRail() +
  '<div class="topology-stage" id="topology-stage">' +
  renderTopology() +
  '<div class="canvas-dimmer" id="canvas-dimmer" aria-hidden="true" hidden></div>' +
  '<aside class="inspector" id="node-inspector" role="dialog" aria-modal="true" aria-live="polite" aria-labelledby="inspector-title" aria-describedby="inspector-detail" hidden>' +
  '<div class="inspector__topline"><span class="section-kicker">NODE INSPECTOR</span><button class="inspector__close" id="inspector-close" type="button" aria-label="Close node inspector">Close</button></div>' +
  '<h2 id="inspector-title"></h2>' +
  '<div class="inspector__status" id="inspector-status" hidden>TRANSITIONAL NODE</div>' +
  '<dl class="inspector__facts">' +
  '<div><dt>Zone</dt><dd id="inspector-zone"></dd></div>' +
  '<div><dt>Kind</dt><dd id="inspector-kind"></dd></div>' +
  '</dl>' +
  '<p class="inspector__detail" id="inspector-detail"></p>' +
  '</aside>' +
  '</div>' +
  '<p class="scenario-caption" id="scenario-caption" aria-live="polite" aria-atomic="true" hidden></p>' +
  renderLegend() +
  '</div>'

const caption = document.querySelector<HTMLParagraphElement>('#scenario-caption')!
const scenarioButtons = new Map(
  [...document.querySelectorAll<HTMLButtonElement>('[data-scenario-id]')].map((button) => [button.dataset.scenarioId!, button]),
)
const renderedSvg = document.querySelector<SVGSVGElement>('#app svg')!
const renderedEdges = new Map(
  [...renderedSvg.querySelectorAll<SVGPathElement>('path.edge')].map((path) => [path.id, path]),
)
const edgesById = new Map(topology.edges.map((edge) => [edge.id, edge]))
const nodeById = new Map(topology.nodes.map((node) => [node.id, node]))
const zoneById = new Map(topology.zones.map((zone) => [zone.id, zone]))
const nodeControls = new Map(
  [...renderedSvg.querySelectorAll<SVGGElement>('.node-control')].map((node) => [node.dataset.nodeId!, node]),
)
const stage = document.querySelector<HTMLDivElement>('#topology-stage')!
const dimmer = document.querySelector<HTMLDivElement>('#canvas-dimmer')!
const inspector = document.querySelector<HTMLElement>('#node-inspector')!
const closeInspectorButton = document.querySelector<HTMLButtonElement>('#inspector-close')!
const inspectorTitle = document.querySelector<HTMLHeadingElement>('#inspector-title')!
const inspectorZone = document.querySelector<HTMLElement>('#inspector-zone')!
const inspectorKind = document.querySelector<HTMLElement>('#inspector-kind')!
const inspectorDetail = document.querySelector<HTMLParagraphElement>('#inspector-detail')!
const inspectorStatus = document.querySelector<HTMLElement>('#inspector-status')!
let invokingNode: SVGGElement | null = null
let selectedNodeId: string | null = null

declare global {
  interface Window {
    homelabPacket: {
      start: (edgeId: string, flowKind: FlowKind, duration?: number, reverse?: boolean) => PacketHandle
      edges: typeof topology.edges
      scenarios: typeof scenarios
    }
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
  stage.dataset.inspectorOpen = 'true'
  dimmer.hidden = false
  inspector.hidden = false
  renderedSvg.setAttribute('aria-hidden', 'true')
  closeInspectorButton.focus({ preventScroll: true })
}

function closeInspector(): void {
  if (inspector.hidden) return
  inspector.hidden = true
  dimmer.hidden = true
  delete stage.dataset.inspectorOpen
  renderedSvg.removeAttribute('aria-hidden')
  nodeControls.get(selectedNodeId ?? '')?.removeAttribute('data-selected')
  selectedNodeId = null
  const returnTarget = invokingNode
  invokingNode = null
  const fallback = renderedSvg.querySelector<SVGGElement>('.node-control')
  const target = returnTarget?.isConnected ? returnTarget : fallback
  target?.focus({ preventScroll: true })
}

renderedSvg.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return
  const node = event.target.closest<SVGGElement>('.node-control')
  if (node?.dataset.nodeId) openInspector(node.dataset.nodeId, node)
})

renderedSvg.addEventListener('keydown', (event) => {
  if (!(event.target instanceof Element)) return
  const node = event.target.closest<SVGGElement>('.node-control')
  if (!node?.dataset.nodeId) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openInspector(node.dataset.nodeId, node)
  }
})

scenarioButtons.forEach((button, scenarioId) => {
  button.addEventListener('click', () => play(scenarioId))
})

closeInspectorButton.addEventListener('click', closeInspector)
dimmer.addEventListener('click', closeInspector)
inspector.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeInspector()
    return
  }
  if (event.key === 'Tab') {
    event.preventDefault()
    closeInspectorButton.focus({ preventScroll: true })
  }
})

subscribe(({ caption: text, scenarioId, running }) => {
  caption.textContent = text ?? ''
  caption.hidden = text === null
  scenarioButtons.forEach((button, id) => {
    const isRunning = running && scenarioId === id
    button.classList.toggle('scenario-button--running', isRunning)
    button.toggleAttribute('data-running', isRunning)
    if (isRunning) button.setAttribute('aria-current', 'true')
    else button.removeAttribute('aria-current')
    const status = button.querySelector<HTMLElement>('.scenario-button__status')
    if (status) status.hidden = !isRunning
  })
})
