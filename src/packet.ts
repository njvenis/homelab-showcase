import type { Edge, FlowKind, Hop } from './types.ts'

const FADE_DURATION = 600
const PACKET_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const FADE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

type EdgeActivity = {
  active: Set<symbol>
  fade?: Animation
}

const edgeActivity = new Map<string, EdgeActivity>()
const flowVariables: Record<Edge['kind'], string> = {
  control: '--flow-control',
  infer: '--flow-infer',
  memory: '--flow-memory',
  health: '--flow-health',
  egress: '--flow-egress',
  network: '--flow-control',
}

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
let prefersReducedMotion = motionQuery.matches
motionQuery.addEventListener('change', ({ matches }) => {
  prefersReducedMotion = matches
})

export type PacketHandle = {
  promise: Promise<void>
  cancel: () => void
}

/** Cancel packet-owned visual residue when a scenario resets the diagram. */
export function resetPacketActivity(): void {
  document.querySelectorAll<SVGCircleElement>('circle.packet').forEach((packet) => {
    packet.getAnimations().forEach((animation) => animation.cancel())
    packet.remove()
  })

  for (const [edgeId, activity] of edgeActivity) {
    activity.fade?.cancel()
    const edgePath = [...document.querySelectorAll<SVGPathElement>('path.edge')].find((path) => path.id === edgeId)
    edgePath?.getAnimations().forEach((animation) => animation.cancel())
    edgePath?.style.removeProperty('stroke')
  }
  edgeActivity.clear()
}

function pathForCss(pathData: string): string {
  return `path("${pathData.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')}")`
}

function beginActivity(edgePath: SVGPathElement, edge: Edge): symbol {
  const activity = edgeActivity.get(edge.id) ?? { active: new Set<symbol>() }
  activity.fade?.cancel()
  activity.fade = undefined
  const token = Symbol(edge.id)
  activity.active.add(token)
  edgeActivity.set(edge.id, activity)
  edgePath.style.stroke = `var(${flowVariables[edge.kind]})`
  return token
}

function endActivity(edgePath: SVGPathElement, edge: Edge, token: symbol): void {
  const activity = edgeActivity.get(edge.id)
  if (!activity || !activity.active.delete(token) || activity.active.size > 0) return

  const fade = edgePath.animate([{ stroke: `var(${flowVariables[edge.kind]})` }, { stroke: 'var(--rule)' }], {
    duration: FADE_DURATION,
    easing: FADE_EASING,
    fill: 'forwards',
  })
  activity.fade = fade
  const clearFade = () => {
    if (activity.fade !== fade) return
    activity.fade = undefined
    edgePath.style.stroke = ''
    if (activity.active.size === 0) edgeActivity.delete(edge.id)
  }
  fade.onfinish = clearFade
  fade.oncancel = () => {
    if (activity.fade === fade) activity.fade = undefined
  }
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
  packet.style.setProperty('--packet-flow', flow)
  packet.style.setProperty('offset-path', pathForCss(pathData))
  packet.style.setProperty('offset-distance', startDistance)
  svg.append(packet)

  const token = beginActivity(edgePath, edge)
  let animation: Animation | undefined
  let timer: number | undefined
  let settled = false
  let resolvePromise!: () => void
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve
  })

  const finalize = () => {
    if (settled) return
    settled = true
    if (timer !== undefined) window.clearTimeout(timer)
    packet.remove()
    endActivity(edgePath, edge, token)
    resolvePromise()
  }

  if (prefersReducedMotion) {
    timer = window.setTimeout(finalize, hop.duration)
  } else {
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
