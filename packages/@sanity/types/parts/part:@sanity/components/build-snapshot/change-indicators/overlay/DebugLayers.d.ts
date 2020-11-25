/// <reference types="react" />
import {Rect} from './types'
export declare function DebugLayers({
  field,
  change,
}: {
  field: {
    rect: Rect
    bounds: Rect
  }
  change: {
    rect: Rect
    bounds: Rect
  }
}): JSX.Element
