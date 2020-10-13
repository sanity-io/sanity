import getOffsetsTo from './getOffsetsTo'
import {Rect} from '../overlay/types'

export function getElementGeometry(element, parent): {rect: Rect; bounds: Rect} {
  const {rect, bounds} = getOffsetsTo(element, parent)
  return {
    bounds,
    rect
  }
}
