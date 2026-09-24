// The widget floats above the studio and covers whatever sits in the corner it is
// docked in, so it can be moved between all four corners instead of having to be
// turned off to see what is behind it.

export const PANEL_CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const

export type PanelCorner = (typeof PANEL_CORNERS)[number]

export const DEFAULT_CORNER: PanelCorner = 'bottom-left'

export type DragDirection = 'up' | 'down' | 'left' | 'right'

interface Point {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

export function isPanelCorner(value: unknown): value is PanelCorner {
  return PANEL_CORNERS.some((corner) => corner === value)
}

/** The corner of the quadrant `center` falls in — the drop target while dragging. */
export function cornerFromPoint(center: Point, viewport: Size): PanelCorner {
  const vertical = center.y * 2 < viewport.height ? 'top' : 'bottom'
  const horizontal = center.x * 2 < viewport.width ? 'left' : 'right'
  return `${vertical}-${horizontal}`
}

/** Keyboard equivalent of a drag: move along one axis, stay put on the other. */
export function moveCorner(corner: PanelCorner, direction: DragDirection): PanelCorner {
  const vertical = corner.startsWith('top') ? 'top' : 'bottom'
  const horizontal = corner.endsWith('left') ? 'left' : 'right'
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
