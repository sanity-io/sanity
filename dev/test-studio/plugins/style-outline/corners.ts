// The widget floats above the studio and covers whatever sits in the corner it is
// docked in, so it can be thrown between all four corners instead of having to be
// turned off to see what is behind it.
//
// Its position is a single point — the anchor — held in two motion values and
// applied as `translate(anchor) translate(origin)`, where `origin` is `0%` or
// `-100%` per axis. The anchor is therefore the widget's own docked corner: a
// bottom-right widget hangs off its bottom-right corner and grows up and to the
// left, so opening or collapsing the panel never has to move it, and a resting
// anchor depends on nothing but the viewport.

const PANEL_CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const

export type PanelCorner = (typeof PANEL_CORNERS)[number]

export const DEFAULT_CORNER: PanelCorner = 'bottom-left'

export type DragDirection = 'up' | 'down' | 'left' | 'right'

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

/** Kept between the widget and the two viewport edges it is docked against. */
const EDGE_GAP = 12

// A release carries as far as Motion's own drag momentum would take it — `power`
// from its default inertia transition — so a flick lands in the corner it was
// aimed at rather than the one it happened to be let go over.
const MOMENTUM_POWER = 0.8

export function isPanelCorner(value: unknown): value is PanelCorner {
  return PANEL_CORNERS.some((corner) => corner === value)
}

function isLeft(corner: PanelCorner): boolean {
  return corner.endsWith('left')
}

function isTop(corner: PanelCorner): boolean {
  return corner.startsWith('top')
}

/** The widget's own corner that the anchor holds, as CSS transform percentages. */
export function anchorOrigin(corner: PanelCorner): {x: string; y: string} {
  return {x: isLeft(corner) ? '0%' : '-100%', y: isTop(corner) ? '0%' : '-100%'}
}

/** Where the anchor sits when the widget is docked in `corner`. */
export function restingAnchor(corner: PanelCorner, viewport: Size): Point {
  return {
    x: isLeft(corner) ? EDGE_GAP : viewport.width - EDGE_GAP,
    y: isTop(corner) ? EDGE_GAP : viewport.height - EDGE_GAP,
  }
}

/** Distance from the widget's top left corner to the one the anchor holds. */
function anchorInset(corner: PanelCorner, size: Size): Point {
  return {x: isLeft(corner) ? 0 : size.width, y: isTop(corner) ? 0 : size.height}
}

/** The position `anchor` describes, held against `to`'s corner instead of `from`'s. */
export function rebaseAnchor(anchor: Point, size: Size, from: PanelCorner, to: PanelCorner): Point {
  const before = anchorInset(from, size)
  const after = anchorInset(to, size)
  return {x: anchor.x - before.x + after.x, y: anchor.y - before.y + after.y}
}

/**
 * The corner a release lands in: the one nearest to where the widget would come to
 * rest. The two docked positions on an axis sit symmetrically about the middle of
 * the viewport whatever the widget's size, so the nearer one is the nearer half.
 */
export function releaseCorner(center: Point, velocity: Point, viewport: Size): PanelCorner {
  const restX = center.x + velocity.x * MOMENTUM_POWER
  const restY = center.y + velocity.y * MOMENTUM_POWER
  const vertical = restY * 2 < viewport.height ? 'top' : 'bottom'
  const horizontal = restX * 2 < viewport.width ? 'left' : 'right'
  return `${vertical}-${horizontal}`
}

/** Keyboard equivalent of a drag: move along one axis, stay put on the other. */
export function moveCorner(corner: PanelCorner, direction: DragDirection): PanelCorner {
  const vertical = isTop(corner) ? 'top' : 'bottom'
  const horizontal = isLeft(corner) ? 'left' : 'right'
  switch (direction) {
    case 'up':
      return `top-${horizontal}`
    case 'down':
      return `bottom-${horizontal}`
    case 'left':
      return `${vertical}-left`
    case 'right':
      return `${vertical}-right`
    default: {
      const exhaustive: never = direction
      return exhaustive
    }
  }
}
