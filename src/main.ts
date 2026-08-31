import './style.css'
import { topology } from './data/load.ts'
import { edgePath, getNodeRects, layout, NODE_HEIGHT, type NodeRect } from './layout.ts'

const NODE_RX = 8
const ZONE_RX = 16

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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
      return (
        `<rect class="node-box${node.transitional ? ' node--transitional' : ''}" x="${rect.x.toFixed(1)}" y="${rect.y.toFixed(1)}" width="${rect.width.toFixed(1)}" height="${NODE_HEIGHT}" rx="${NODE_RX}"/>` +
        `<text class="node-label" x="${centerX.toFixed(1)}" y="${(centerY + 4).toFixed(1)}">${esc(node.label)}</text>`
      )
    })
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Homelab stack topology">${markerDefs}${zoneEls.join('')}${edgeEls.join('')}${nodeEls.join('')}</svg>`
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = renderTopology()
