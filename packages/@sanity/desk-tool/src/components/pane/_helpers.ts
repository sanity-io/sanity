import {PANE_DEFAULT_MIN_WIDTH} from './constants'
import {PaneConfig, PaneResizeCache} from './types'

/**
 * @internal
 */
export function _getDOMPath(rootElement: HTMLElement, el: HTMLElement): number[] {
  const path: number[] = []

  let e = el

  while (e !== rootElement) {
    const parentElement = e.parentElement

    if (!parentElement) return path

    const children = Array.from(parentElement.childNodes)
    const index = children.indexOf(e)

    path.unshift(index)

    if (parentElement === rootElement) {
      return path
    }

    e = parentElement
  }

  return path
}

const EMPTY_PATH: number[] = []

/**
 * @internal
 */
export function _sortPaneConfigs(rootElement: HTMLElement | null, paneConfigs: PaneConfig[]): void {
  if (!rootElement) return

  const map = new WeakMap<HTMLElement, number[]>()

  for (const config of paneConfigs) {
    map.set(config.element, _getDOMPath(rootElement, config.element))
  }

  const _sort = (a: PaneConfig, b: PaneConfig) => {
    const _a = map.get(a.element) || EMPTY_PATH
    const _b = map.get(b.element) || EMPTY_PATH

    const len = Math.max(_a.length, _b.length)

    // Loop until there are different indexes
    for (let i = 0; i < len; i += 1) {
      const aIndex = _a[i] || -1
      const bIndex = _b[i] || -1

      if (aIndex !== bIndex) {
        return aIndex - bIndex
      }
    }

    return 0
  }

  paneConfigs.sort(_sort)
}

export function _calcPaneResize(
  cache: PaneResizeCache,
  left: PaneConfig,
  right: PaneConfig,
  deltaX: number
): {leftFlex: number; leftW: number; rightFlex: number; rightW: number} {
  const sumW = cache.left.width + cache.right.width
  const sumFlex = cache.left.flex + cache.right.flex

  const leftMinWidth = left.opts.minWidth || PANE_DEFAULT_MIN_WIDTH
  const rightMinWidth = right.opts.minWidth || PANE_DEFAULT_MIN_WIDTH

  const leftMaxWidth = left.opts.maxWidth || sumW - rightMinWidth
  const rightMaxWidth = right.opts.maxWidth || sumW - leftMinWidth

  const minDeltaX = Math.min(leftMinWidth - cache.left.width, rightMaxWidth - sumW)
  const maxDeltaX = Math.min(
    cache.right.width - rightMinWidth,
    cache.right.width - (sumW - leftMaxWidth)
  )

  const _deltaX = Math.min(Math.max(deltaX, minDeltaX), maxDeltaX)

  const leftW = cache.left.width + _deltaX
  const rightW = cache.right.width - _deltaX

  const leftFlex = (leftW / sumW) * sumFlex
  const rightFlex = (rightW / sumW) * sumFlex

  return {leftFlex, leftW, rightFlex, rightW}
}
