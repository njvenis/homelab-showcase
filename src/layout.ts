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

export const NODE_HEIGHT = 36

export type NodeRect = {
  x: number
  y: number
  width: number
  height: number
}

export function nodeWidth(label: string, zoneInner: number): number {
  // ponytail: width estimated from char count, capped to the zone's inner width;
  // upgrade to canvas measureText if labels visibly collide
  return Math.min(label.length * 7.2 + 24, zoneInner)
}

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

export function getNodeRects(zoneId: string): Map<string, NodeRect> {
  const zone = layout.zones[zoneId as keyof typeof layout.zones]
  if (!zone) {
    throw new Error(`unknown zone: ${zoneId}`)
  }

  const positions = getNodePositions(zoneId)
  const inner = zone.width - zone.padding * 2 - 8
  return new Map(
    topology.nodes
      .filter((node) => node.zone === zoneId)
      .map((node) => {
        const position = positions.get(node.id)!
        const width = nodeWidth(node.label, inner)
        return [node.id, {
          x: position.x - width / 2,
          y: position.y - NODE_HEIGHT / 2,
          width,
          height: NODE_HEIGHT,
        }]
      }),
  )
}

type Side = 'left' | 'right' | 'top' | 'bottom'

type Anchor = { x: number; y: number; normalX: number; normalY: number }

function anchor(rect: NodeRect, side: Side): Anchor {
  switch (side) {
    case 'left':
      return { x: rect.x, y: rect.y + rect.height / 2, normalX: -1, normalY: 0 }
    case 'right':
      return { x: rect.x + rect.width, y: rect.y + rect.height / 2, normalX: 1, normalY: 0 }
    case 'top':
      return { x: rect.x + rect.width / 2, y: rect.y, normalX: 0, normalY: -1 }
    case 'bottom':
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height, normalX: 0, normalY: 1 }
  }
}

const formatCoordinate = (value: number): string => value.toFixed(1)

export function edgePath(from: NodeRect, to: NodeRect): string {
  const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 }
  const toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 }
  const dx = toCenter.x - fromCenter.x
  const dy = toCenter.y - fromCenter.y
  const horizontal = Math.abs(dx) >= Math.abs(dy)
  const fromSide: Side = horizontal ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top')
  const toSide: Side = horizontal ? (dx >= 0 ? 'left' : 'right') : (dy >= 0 ? 'top' : 'bottom')
  const start = anchor(from, fromSide)
  const end = anchor(to, toSide)
  const distance = Math.hypot(end.x - start.x, end.y - start.y)
  const controlDistance = Math.min(Math.max(distance * 0.4, 24), 160)
  const control1 = {
    x: start.x + start.normalX * controlDistance,
    y: start.y + start.normalY * controlDistance,
  }
  const control2 = {
    x: end.x + end.normalX * controlDistance,
    y: end.y + end.normalY * controlDistance,
  }

  return [
    `M ${formatCoordinate(start.x)} ${formatCoordinate(start.y)}`,
    `C ${formatCoordinate(control1.x)} ${formatCoordinate(control1.y)},`,
    `${formatCoordinate(control2.x)} ${formatCoordinate(control2.y)},`,
    `${formatCoordinate(end.x)} ${formatCoordinate(end.y)}`,
  ].join(' ')
}
