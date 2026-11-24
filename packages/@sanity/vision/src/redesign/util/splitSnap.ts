/** The snap zone is this share of the container, kept between the two pixel limits below */
const SNAP_THRESHOLD_SHARE = 0.015
const MIN_SNAP_THRESHOLD = 8
const MAX_SNAP_THRESHOLD = 12

export interface SplitSnap {
  /** The primary pane's size that splits the container in two equal panes */
  center: number
  /** How far from `center`, in pixels, a dragged size is held there */
  threshold: number
}

/**
 * Where a split of `extent` pixels, with a divider of `handleSize`, snaps to equal halves, or
 * `null` when equal halves would break a pane's minimum (`min` to `max` is the range the primary
 * pane may take).
 */
export function getSplitSnap(
  extent: number,
  handleSize: number,
  bounds: {min: number; max: number},
): SplitSnap | null {
  const center = Math.round((extent - handleSize) / 2)
  if (center < bounds.min || center > bounds.max) return null
  const threshold = Math.min(
    MAX_SNAP_THRESHOLD,
    Math.max(MIN_SNAP_THRESHOLD, extent * SNAP_THRESHOLD_SHARE),
  )
  return {center, threshold}
}

export interface DragSnap {
  /** The primary pane's size for this pointer position */
  size: number
  /** Whether the drag is still engaged with the center, which the next move carries forward */
  engaged: boolean
}

/**
 * The size a drag that would put the primary pane at `size` lands on. A drag engages when the
 * pointer comes within the threshold of the center, and holds it there. Once engaged, the size
 * ramps back to the pointer over another threshold's distance, so the pane neither jumps when it
 * is caught nor when it is let go. A drag that starts already near the center, outside the
 * threshold, is not engaged and follows the pointer from its first move.
 */
export function snapDragSize(size: number, snap: SplitSnap | null, engaged: boolean): DragSnap {
  if (!snap) return {size, engaged: false}
  const {center, threshold} = snap
  const distance = Math.abs(size - center)
  if (distance <= threshold) return {size: center, engaged: true}
  if (engaged && distance < threshold * 2) {
    return {
      size: Math.round(center + Math.sign(size - center) * (distance - threshold) * 2),
      engaged: true,
    }
  }
  return {size, engaged: false}
}

/** A keyboard step from `from` to `to` that would pass over the center stops on it */
export function snapKeyboardStep(from: number, to: number, snap: SplitSnap | null): number {
  if (!snap) return to
  const {center} = snap
  return (from < center && to > center) || (from > center && to < center) ? center : to
}
