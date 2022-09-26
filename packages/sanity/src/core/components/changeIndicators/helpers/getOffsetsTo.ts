import {Rect} from '../overlay/types'
import {hasOverflowScroll} from './scrollUtils'

export const getOffsetsTo = (
  source: HTMLElement,
  target: HTMLElement
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
