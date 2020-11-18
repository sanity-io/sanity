import getOffsetsTo from './getOffsetsTo'
import {Rect} from '../overlay/types'

export function getElementGeometry(
  element: HTMLElement,
  parent: HTMLElement
): {rect: Rect; bounds: Rect} {
  const {rect, bounds} = getOffsetsTo(element, parent)
  return {
    bounds,
    rect,
  }
}
