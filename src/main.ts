import './style.css'
import { topology } from './data/load.ts'
import { layout, getNodePositions } from './layout.ts'

const NODE_HEIGHT = 36
const NODE_RX = 8
const ZONE_RX = 16

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function nodeWidth(label: string, zoneInner: number): number {
  // ponytail: width estimated from char count, capped at the zone's inner width;
  // upgrade to canvas measureText if labels visibly collide
  return Math.min(label.length * 7.2 + 24, zoneInner)
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

  const nodeEls = topology.zones.flatMap((zone) => {
    const r = layout.zones[zone.id as keyof typeof layout.zones]!
    const positions = getNodePositions(zone.id)
    const inner = r.width - r.padding * 2 - 8
    return topology.nodes.filter((node) => node.zone === zone.id).map((node) => {
      const p = positions.get(node.id)!
      const w = nodeWidth(node.label, inner)
      return (
        `<rect class="node-box${node.transitional ? ' node--transitional' : ''}" x="${(p.x - w / 2).toFixed(1)}" y="${(p.y - NODE_HEIGHT / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${NODE_HEIGHT}" rx="${NODE_RX}"/>` +
        `<text class="node-label" x="${p.x}" y="${p.y + 4}">${esc(node.label)}</text>`
      )
    })
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Homelab stack topology">${zoneEls.join('')}${nodeEls.join('')}</svg>`
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = renderTopology()