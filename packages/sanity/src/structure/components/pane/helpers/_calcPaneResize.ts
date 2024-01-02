import {PANE_DEFAULT_MIN_WIDTH} from '../constants'
import {PaneConfigOpts, PaneResizeCache} from '../types'

export function _calcPaneResize(
  cache: PaneResizeCache,
  left: PaneConfigOpts,
  right: PaneConfigOpts,
  deltaX: number,
): {leftFlex: number; leftW: number; rightFlex: number; rightW: number} {
  const sum = {
    flex: cache.left.flex + cache.right.flex,
    width: cache.left.width + cache.right.width,
  }

  const leftMinWidth = left.minWidth ?? PANE_DEFAULT_MIN_WIDTH
  const rightMinWidth = right.minWidth ?? PANE_DEFAULT_MIN_WIDTH

  const leftMaxWidth = Math.min(left.maxWidth || Infinity, sum.width - rightMinWidth)
  const rightMaxWidth = Math.min(right.maxWidth || Infinity, sum.width - leftMinWidth)

  // Get min. delta X
  let minDeltaX = leftMinWidth - cache.left.width
  const rightMinDeltaX = cache.right.width - rightMaxWidth
  if (minDeltaX < rightMinDeltaX) {
    minDeltaX = rightMinDeltaX
  }

  // Get max. delta X
  let maxDeltaX = cache.right.width - rightMinWidth
  const leftMaxDeltaX = leftMaxWidth - cache.left.width
  if (maxDeltaX > leftMaxDeltaX) {
    maxDeltaX = leftMaxDeltaX
  }

  const _deltaX = Math.min(Math.max(deltaX, minDeltaX), maxDeltaX)

  const leftW = cache.left.width + _deltaX
  const rightW = cache.right.width - _deltaX

  const leftFlex = (leftW / sum.width) * sum.flex
  const rightFlex = (rightW / sum.width) * sum.flex

  return {leftFlex, leftW, rightFlex, rightW}
}
