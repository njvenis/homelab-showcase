import { topology } from './data/load.ts'

export type ZoneLayout = {
  x: number
  y: number
  width: number
  height: number
  padding: number
}

export type LayoutMode = 'wide' | 'stacked'

export type StageLayout = {
  mode: LayoutMode
  viewBox: { width: number; height: number }
  zones: Record<string, ZoneLayout>
}

const wideLayout = {
  mode: 'wide',
  viewBox: { width: 1400, height: 900 },
  zones: {
    pi: { x: 40, y: 60, width: 450, height: 780, padding: 48 },
    wsl: { x: 530, y: 60, width: 550, height: 780, padding: 48 },
    ext: { x: 1120, y: 60, width: 240, height: 780, padding: 48 },
  } satisfies Record<string, ZoneLayout>,
} as const

export const layout = wideLayout

export const STAGE_STACK_THRESHOLD = 900

const STACK_SIDE_MARGIN = 20
const STACK_TOP = 24
const STACK_HEADER = 40
const STACK_ZONE_GAP = 20

// STACK_ROW_PITCH is derived from live data so adding a node cannot silently
// breach the viewBox height bound (spec: stacked-layout constants).
const STACK_PITCH_FLOOR = 40 // NODE_HEIGHT 36 + 4px minimum gutter
const STACK_PITCH_CEIL = 64 // the pre-change value; never exceed it
const STACK_BUDGET = 1200 // spec: stacked viewBox height cap

// Clearance policy — geometric, never authored into JSON. See stage-composition spec
// (adjacent node label clearance >= 6px). These throw on purpose instead of clipping
// labels or collapsing distinct edges, so geometry always faithfully reflects topology.
export const MIN_VERTICAL_CLEARANCE = 6 // gaps kept between adjacent node label boxes
export const STACK_LANE_POOL = 4

export class LayoutClearanceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LayoutClearanceError'
  }
}

function stackRowPitch(nodeCount: number, zoneCount: number): number {
  const chrome = zoneCount * STACK_HEADER
    + (zoneCount - 1) * STACK_ZONE_GAP
    + 2 * STACK_TOP
    + zoneCount * 20 // per-zone bottom padding
  const budget = Math.floor((STACK_BUDGET - chrome) / nodeCount)
  const pitch = Math.max(STACK_PITCH_FLOOR, Math.min(STACK_PITCH_CEIL, budget))
  // Fail (do not floor) once adjacent node label clearance drops below the policy.
  if (pitch - NODE_HEIGHT < MIN_VERTICAL_CLEARANCE) {
    throw new LayoutClearanceError(
      `stacked layout: ${nodeCount} nodes cannot keep ${MIN_VERTICAL_CLEARANCE}px clearance ` +
      `between adjacent node labels within the ${STACK_BUDGET}px budget ` +
      `(pitch ${pitch}px, gap ${pitch - NODE_HEIGHT}px). Remove nodes or raise the budget.`,
    )
  }
  return pitch
}

export function stackedLayout(stageWidth: number): StageLayout {
  const width = Math.max(1, Math.round(stageWidth))
  const pitch = stackRowPitch(topology.nodes.length, topology.zones.length)
  const zones: Record<string, ZoneLayout> = {}
  let y = STACK_TOP

  for (const zone of topology.zones) {
    const nodeCount = topology.nodes.filter((node) => node.zone === zone.id).length
    const height = STACK_HEADER + nodeCount * pitch + 20
    zones[zone.id] = {
      x: STACK_SIDE_MARGIN,
      y,
      width: Math.max(1, width - STACK_SIDE_MARGIN * 2),
      height,
      padding: 16,
    }
    y += height + STACK_ZONE_GAP
  }

  const viewBoxHeight = y - STACK_ZONE_GAP + STACK_TOP
  if (viewBoxHeight > STACK_BUDGET) {
    throw new LayoutClearanceError(
      `stacked layout viewBox height ${Math.round(viewBoxHeight)}px exceeds the ` +
      `${STACK_BUDGET}px budget at ${Math.round(width)}px stage width; cannot avoid clipping.`,
    )
  }

  return {
    mode: 'stacked',
    viewBox: { width, height: viewBoxHeight },
    zones,
  }
}

export function selectLayout(stageWidth: number): StageLayout {
  const layout = stageWidth >= STAGE_STACK_THRESHOLD ? wideLayout : stackedLayout(stageWidth)
  if (layout.mode === 'stacked') assertDistinctEdgePaths(layout)
  return layout
}

// Aggregate every node rect across zones, so cross-zone edges can be routed and checked.
function collectNodeRects(layout: StageLayout): Map<string, NodeRect> {
  const rects = new Map<string, NodeRect>()
  for (const zone of topology.zones) {
    for (const [id, rect] of getNodeRects(zone.id, layout)) rects.set(id, rect)
  }
  return rects
}

// One semantic edge per declared edge: each edge must resolve to a distinct path so the
// network never reads as duplicate or collapsed lines. Fails deterministically rather
// than emitting two edges on top of one another.
function assertDistinctEdgePaths(layout: StageLayout): void {
  const rects = collectNodeRects(layout)
  const byPath = new Map<string, string>()
  for (const edge of topology.edges) {
    const from = rects.get(edge.from)
    const to = rects.get(edge.to)
    if (!from || !to) continue
    const path = edgePath(from, to, layout)
    const previous = byPath.get(path)
    if (previous !== undefined) {
      throw new LayoutClearanceError(
        `edges "${previous}" and "${edge.id}" resolve to the same path; distinct edges ` +
        `must keep distinct geometry — widen clearance so their endpoints diverge.`,
      )
    }
    byPath.set(path, edge.id)
  }
}

export type NodePosition = { x: number; y: number }

export const NODE_HEIGHT = 36

// Intrinsic label width for the stacked layout. The SVG renders text in 12px IBM Plex Sans;
// at that size each glyph averages ~6.2px plus box side padding (~12px), so a label's bounding
// box is estimated as `glyphWidth * length + LABEL_BOX_PADDING`. This matches the width applied
// to the node rect (`getNodeRects`), so the clearance guards below cannot false-positive on it.
// A node rect is permitted to fill the zone inner exactly (no zone-side inset); the only bound
// is the fixed-height budget and adjacent-label vertical clearance, both of which stay enforced.
export const LABEL_GLYPH_WIDTH = 6.2
export const LABEL_BOX_PADDING = 12

export type NodeRect = {
  x: number
  y: number
  width: number
  height: number
}

export function nodeWidth(label: string, zoneInner: number): number {
  return Math.min(label.length * LABEL_GLYPH_WIDTH + LABEL_BOX_PADDING, zoneInner)
}

export function getNodePositions(zoneId: string, stageLayout: StageLayout = layout): Map<string, NodePosition> {
  const zone = stageLayout.zones[zoneId]
  if (!zone) {
    throw new Error(`unknown zone: ${zoneId}`)
  }

  const nodes = topology.nodes.filter((node) => node.zone === zoneId)
  if (stageLayout.mode === 'stacked') {
    const pitch = stackRowPitch(topology.nodes.length, topology.zones.length)
    return new Map(
      nodes.map((node, index) => [node.id, {
        x: zone.x + zone.width / 2,
        y: zone.y + STACK_HEADER + (index + 0.5) * pitch,
      }]),
    )
  }

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

export function getNodeRects(zoneId: string, stageLayout: StageLayout = layout): Map<string, NodeRect> {
  const zone = stageLayout.zones[zoneId]
  if (!zone) {
    throw new Error(`unknown zone: ${zoneId}`)
  }

  const positions = getNodePositions(zoneId, stageLayout)
  const inner = zone.width - zone.padding * 2 - 8
  return new Map(
    topology.nodes
      .filter((node) => node.zone === zoneId)
      .map((node) => {
        const position = positions.get(node.id)!
        const width = nodeWidth(node.label, inner)
        if (stageLayout.mode === 'stacked') {
          // A node may fill the zone inner exactly; the horizontal bound exists only to catch a
          // computed box wider than the inner (would clip/overflow), which nodeWidth() caps before
          // here, so this is a defensive assertion on the same width used for the rect sizing above.
          if (width > inner) {
            throw new LayoutClearanceError(
              `node "${node.id}" needs ${Math.round(width)}px but the zone inner is ` +
              `${Math.round(inner)}px; cannot fit without clipping. Shorten the label or widen the stage.`,
            )
          }
        }
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

function stackedChannelPath(from: NodeRect, to: NodeRect, stageLayout: StageLayout): string | undefined {
  const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 }
  const toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 }
  const pitch = stackRowPitch(topology.nodes.length, topology.zones.length)
  if (Math.abs(toCenter.y - fromCenter.y) < pitch + 1) return undefined

  const hash = Math.abs(Math.round(from.x * 3 + from.y * 5 + to.x * 7 + to.y * 11))
  const lane = hash % STACK_LANE_POOL
  const left = hash % 2 === 0
  const laneTread = (stageLayout.viewBox.width - 16) / STACK_LANE_POOL
  const channelX = left ? 8 + lane * laneTread : stageLayout.viewBox.width - 8 - lane * laneTread
  const startX = left ? from.x : from.x + from.width
  const endX = left ? to.x : to.x + to.width

  return [
    `M ${formatCoordinate(startX)} ${formatCoordinate(fromCenter.y)}`,
    `C ${formatCoordinate(channelX)} ${formatCoordinate(fromCenter.y)},`,
    `${formatCoordinate(channelX)} ${formatCoordinate(toCenter.y)},`,
    `${formatCoordinate(endX)} ${formatCoordinate(toCenter.y)}`,
  ].join(' ')
}

export function edgePath(from: NodeRect, to: NodeRect, stageLayout: StageLayout = layout): string {
  if (stageLayout.mode === 'stacked') {
    const routedPath = stackedChannelPath(from, to, stageLayout)
    if (routedPath) return routedPath
  }

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
