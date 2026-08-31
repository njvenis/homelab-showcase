import { topology } from './data/load.ts'

export type ZoneLayout = {
  x: number
  y: number
  width: number
  height: number
  padding: number
}

export const layout = {
  viewBox: { width: 1400, height: 900 },
  zones: {
    pi: { x: 40, y: 60, width: 450, height: 780, padding: 48 },
    wsl: { x: 530, y: 60, width: 550, height: 780, padding: 48 },
    ext: { x: 1120, y: 60, width: 240, height: 780, padding: 48 },
  } satisfies Record<string, ZoneLayout>,
} as const

export type NodePosition = { x: number; y: number }

export function getNodePositions(zoneId: string): Map<string, NodePosition> {
  const zone = layout.zones[zoneId as keyof typeof layout.zones]
  if (!zone) {
    throw new Error(`unknown zone: ${zoneId}`)
  }

  const nodes = topology.nodes.filter((node) => node.zone === zoneId)
  const columns = Math.max(
    1,
    Math.ceil(Math.sqrt((nodes.length * (zone.width - zone.padding * 2)) / (zone.height - zone.padding * 2))),
  )
  const rows = Math.max(1, Math.ceil(nodes.length / columns))
  const cellWidth = (zone.width - zone.padding * 2) / columns
  const cellHeight = (zone.height - zone.padding * 2) / rows

  return new Map(
    nodes.map((node, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      return [node.id, {
        x: zone.x + zone.padding + (column + 0.5) * cellWidth,
        y: zone.y + zone.padding + (row + 0.5) * cellHeight,
      }]
    }),
  )
}
