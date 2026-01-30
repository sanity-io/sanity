import {type Rect} from '../overlay/types'
import {hasOverflowScroll} from './scrollUtils'

export const getOffsetsTo = (
  source: HTMLElement,
  target: HTMLElement,
): {rect: Rect; bounds: Rect} => {
  const bounds: Rect = {
    top: 0,
    left: 0,
    height: target.offsetHeight,
    width: target.offsetWidth,
  }

  const rect: Rect = {
    top: 0,
    left: 0,
    height: source.offsetHeight,
    width: source.offsetWidth,
  }

  // If the source element is not contained within the target (e.g., when the source is
  // rendered in a portal like a dialog), use getBoundingClientRect to calculate the
  // position relative to the target element.
  if (!target.contains(source)) {
    const targetRect = target.getBoundingClientRect()
    const sourceRect = source.getBoundingClientRect()

    // Calculate position relative to the target's content area, accounting for scroll
    rect.top = sourceRect.top - targetRect.top + target.scrollTop
    rect.left = sourceRect.left - targetRect.left + target.scrollLeft

    // For portal elements, use the target's visible scroll area as bounds
    bounds.top = target.scrollTop
    bounds.left = target.scrollLeft
    bounds.height = target.clientHeight
    bounds.width = target.clientWidth

    return {rect, bounds}
  }

  let foundScrollContainer = false
  let el: HTMLElement | null = source

  while (el && el !== target && target.contains(el)) {
    if (foundScrollContainer) {
      bounds.top += el.offsetTop
      bounds.left += el.offsetLeft
    }

    if (hasOverflowScroll(el)) {
      bounds.top = el.offsetTop
      bounds.height = el.offsetHeight
      bounds.left = el.offsetLeft
      bounds.width = el.offsetWidth

      foundScrollContainer = true
    }

    rect.top += el.offsetTop - el.scrollTop
    rect.left += el.offsetLeft - el.scrollLeft

    el = el.offsetParent as HTMLElement
  }

  return {rect, bounds}
}
