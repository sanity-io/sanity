/**
 * Where the versions flyout of a row's status marks opens, in surfaces where the rows sit inside a
 * box the flyout must not cover (the search dialog, a form field): beside the box, outside it,
 * top aligned with the row. Pure geometry, so it can be tested without a browser.
 */

/** A box on screen, in viewport coordinates (a `DOMRect` fits). */
export interface FlyoutRect {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * The flyout's width: the 400px panel of `DocumentVersionsFlyoutList` (`root` in its stylesheet)
 * and the 1px border of the card around it on each side.
 */
export const MARKS_FLYOUT_WIDTH = 402

/** Space between the box and the flyout. */
export const MARKS_FLYOUT_GAP = 8

/** Space the flyout keeps from the edges of the viewport. */
export const MARKS_FLYOUT_VIEWPORT_MARGIN = 8

/**
 * The offset `@sanity/ui`'s Popover always adds between its reference and the floating element
 * (its `offset({mainAxis: 4})` middleware). The anchor is moved back by it, so the gap is exact.
 */
export const POPOVER_OFFSET = 4

/** Which side of the box the flyout opens on. */
export type MarksFlyoutSide = 'right' | 'left'

/**
 * The side of `container` the flyout opens on: the right when it fits there between the box and
 * the viewport's edge, else the left, else `null` (no room on either side, as in a narrow viewport
 * or a box that fills the screen): then the flyout does not open, and the marks alone show the state.
 */
export function getMarksFlyoutSide(options: {
  container: FlyoutRect
  viewportWidth: number
  width?: number
  gap?: number
  margin?: number
}): MarksFlyoutSide | null {
  const {
    container,
    viewportWidth,
    width = MARKS_FLYOUT_WIDTH,
    gap = MARKS_FLYOUT_GAP,
    margin = MARKS_FLYOUT_VIEWPORT_MARGIN,
  } = options
  if (container.right + gap + width <= viewportWidth - margin) return 'right'
  if (container.left - gap - width >= margin) return 'left'
  return null
}

/**
 * The reference box the Popover places the flyout against: a zero-width line at the box's edge on
 * `side` (moved out by the gap, and back by the Popover's own offset), as tall as the row and at
 * its height. With `right-start` (or `left-start`) and no fallback placements, the flyout's top
 * lines up with the row's top and its near edge sits `gap` away from the box; the Popover's `shift`
 * then only slides it up or down to stay in the viewport, never across the box.
 */
export function getMarksFlyoutAnchor(options: {
  container: FlyoutRect
  row: FlyoutRect
  side: MarksFlyoutSide
  gap?: number
}): FlyoutRect & {x: number; y: number; width: number; height: number} {
  const {container, row, side, gap = MARKS_FLYOUT_GAP} = options
  const x =
    side === 'right'
      ? container.right + gap - POPOVER_OFFSET
      : container.left - gap + POPOVER_OFFSET
  return {
    x,
    y: row.top,
    left: x,
    right: x,
    top: row.top,
    bottom: row.bottom,
    width: 0,
    height: row.bottom - row.top,
  }
}
