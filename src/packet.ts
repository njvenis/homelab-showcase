import type { Edge, FlowKind, Hop } from './types.ts'

const FADE_DURATION = 600
const PACKET_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const FADE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

type EdgeActivity = {
  active: Set<symbol>
  fades: Animation[]
}

const edgeActivity = new Map<string, EdgeActivity>()
const flowVariables: Record<Edge['kind'], string> = {
  control: '--flow-control',
  infer: '--flow-infer',
  memory: '--flow-memory',
  health: '--flow-health',
  egress: '--flow-egress',
  network: '--flow-network',
}

// Full-bright during traffic, dimmed per-kind hue at rest. Derived once in CSS
// as a light mix of each kind's flow hue over --rule; packet.ts animates between.
const idleTokens: Record<Edge['kind'], string> = {
  control: '--edge-idle-control',
  infer: '--edge-idle-infer',
  memory: '--edge-idle-memory',
  health: '--edge-idle-health',
  egress: '--edge-idle-egress',
  network: '--edge-idle-network',
}

// The renderer places an aria-hidden duplicate behind each edge, keyed by the
// same id via data-edge-id. Look the glow up by that id rather than assuming a
// sibling relationship, so the pairing survives reflows and re-renders.
function glowFor(edgeId: string): SVGPathElement | null {
  return document.querySelector<SVGPathElement>(`.edge-glow[data-edge-id="${CSS.escape(edgeId)}"]`)
}

export type PacketHandle = {
  promise: Promise<void>
  cancel: () => void
}

// After edge geometry is rebuilt (resize/re-layout), the path strings change
// but packets keep running their own offset animation. Re-read each live path
// and refresh the packet's offset-path so it tracks the new geometry, leaving
// the running offset-distance/animation untouched. Skips silently when a path
// is gone so a mid-transient call never throws.
export function refreshPacketPaths(): void {
  document.querySelectorAll<SVGCircleElement>('circle.packet[data-edge-id]').forEach((packet) => {
    const edgeId = packet.getAttribute('data-edge-id')
    if (!edgeId) return
    const path = [...document.querySelectorAll<SVGPathElement>('path.edge')].find((candidate) => candidate.id === edgeId)
    const d = path?.getAttribute('d')
    if (!d) return
    packet.style.setProperty('offset-path', pathForCss(d))
  })
}

/** Cancel packet-owned visual residue when a scenario resets the diagram. */
export function resetPacketActivity(): void {
  document.querySelectorAll<SVGCircleElement>('circle.packet').forEach((packet) => {
    packet.getAnimations().forEach((animation) => animation.cancel())
    packet.remove()
  })

  for (const [edgeId, activity] of edgeActivity) {
    const fades = activity.fades
    activity.fades = []
    fades.forEach((fade) => fade.cancel())
    renderedEdgePath(edgeId).style.removeProperty('stroke')
    glowFor(edgeId)?.style.removeProperty('stroke')
  }
  edgeActivity.clear()
}

function pathForCss(pathData: string): string {
  return `path("${pathData.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')}")`
}

function beginActivity(edgePath: SVGPathElement, edge: Edge): symbol {
  const activity = edgeActivity.get(edge.id) ?? { active: new Set<symbol>(), fades: [] }
  const fades = activity.fades
  activity.fades = []
  fades.forEach((fade) => fade.cancel())
  const token = Symbol(edge.id)
  activity.active.add(token)
  edgeActivity.set(edge.id, activity)

  const activeStroke = `var(${flowVariables[edge.kind]})`
  edgePath.style.stroke = activeStroke
  glowFor(edge.id)?.style.setProperty('stroke', activeStroke)
  return token
}

function endActivity(edgePath: SVGPathElement, edge: Edge, token: symbol): void {
  const activity = edgeActivity.get(edge.id)
  if (!activity || !activity.active.delete(token) || activity.active.size > 0) return

  const glow = glowFor(edge.id)
  const frames = [{ stroke: `var(${flowVariables[edge.kind]})` }, { stroke: `var(${idleTokens[edge.kind]})` }]

  // Track both paths so the inline stroke clears only when the last animation
  // settles, and so a later begin/cancel can tear the pair down together.
  const release = (animation: Animation) => {
    const index = activity.fades.indexOf(animation)
    if (index === -1) return
    activity.fades.splice(index, 1)
    if (activity.fades.length === 0) {
      edgePath.style.removeProperty('stroke')
      glow?.style.removeProperty('stroke')
      if (activity.active.size === 0) edgeActivity.delete(edge.id)
    }
  }

  [edgePath, glow].filter((path): path is SVGPathElement => path !== null).forEach((path) => {
    const fade = path.animate(frames, { duration: FADE_DURATION, easing: FADE_EASING, fill: 'forwards' })
    fade.onfinish = () => release(fade)
    fade.oncancel = () => release(fade)
    activity.fades.push(fade)
  })
}

/** Start one cancellable packet lifecycle while keeping the Promise<void> API. */
function animatePacketHandle(
  edgePath: SVGPathElement,
  edge: Edge,
  hop: Hop,
): PacketHandle {
  if (!Number.isFinite(hop.duration) || hop.duration <= 0) {
    throw new Error('packet duration must be a positive finite number')
  }
  const pathData = edgePath.getAttribute('d')
  const svg = edgePath.ownerSVGElement
  if (!pathData || !svg) throw new Error('packet requires a rendered SVG edge path')

  const packet = edgePath.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'circle')
  const flow = `var(${flowVariables[edge.kind]})`
  const startDistance = hop.reverse ? '100%' : '0%'
  const endDistance = hop.reverse ? '0%' : '100%'
  packet.classList.add('packet')
  packet.setAttribute('r', '5')
  packet.setAttribute('aria-hidden', 'true')
  packet.setAttribute('data-edge-id', edge.id)
  packet.style.setProperty('--packet-flow', flow)
  packet.style.setProperty('offset-path', pathForCss(pathData))
  packet.style.setProperty('offset-distance', startDistance)
  svg.append(packet)

  const token = beginActivity(edgePath, edge)
  let animation: Animation | undefined
  let settled = false
  let resolvePromise!: () => void
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve
  })

  const finalize = () => {
    if (settled) return
    settled = true
    packet.remove()
    endActivity(edgePath, edge, token)
    resolvePromise()
  }

  // Reduced motion is presentation-only: CSS hides .packet under prefers-reduced-motion.
  // The animation always runs so hop timing, cleanup, and overlapping hops stay deterministic.
  try {
    animation = packet.animate([{ offsetDistance: startDistance }, { offsetDistance: endDistance }], {
      duration: hop.duration,
      easing: PACKET_EASING,
      fill: 'forwards',
    })
    animation.onfinish = finalize
    animation.oncancel = finalize
  } catch (error) {
    finalize()
    throw error
  }

  return {
    promise,
    cancel: () => {
      if (animation) animation.cancel()
      finalize()
    },
  }
}

function renderedEdgePath(edgeId: string): SVGPathElement {
  const path = [...document.querySelectorAll<SVGPathElement>('path.edge')].find((candidate) => candidate.id === edgeId)
  if (!path) throw new Error(`unknown rendered edge: ${edgeId}`)
  return path
}

export function animatePacket(edgeId: string, flowKind: FlowKind, duration: number, reverse?: boolean): PacketHandle
export function animatePacket(edgePath: SVGPathElement, edge: Edge, hop: Hop): Promise<void>
export function animatePacket(
  edgeOrId: string | SVGPathElement,
  flowOrEdge: FlowKind | Edge,
  durationOrHop: number | Hop,
  reverse = false,
): PacketHandle | Promise<void> {
  if (typeof edgeOrId === 'string') {
    if (typeof flowOrEdge !== 'string' || typeof durationOrHop !== 'number') {
      throw new Error('string packet calls require a flow kind and duration')
    }
    const edgeId = edgeOrId
    const edgePath = renderedEdgePath(edgeId)
    const edge: Edge = { id: edgeId, from: '', to: '', kind: flowOrEdge }
    const hop: Hop = { edge: edgeId, at: 0, duration: durationOrHop, reverse }
    return animatePacketHandle(edgePath, edge, hop)
  }
  if (typeof flowOrEdge === 'string' || typeof durationOrHop === 'number') {
    throw new Error('path packet calls require an edge and hop')
  }
  return animatePacketHandle(edgeOrId, flowOrEdge, durationOrHop).promise
}
