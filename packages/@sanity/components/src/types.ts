import {Path} from '@sanity/types'
import {Placement} from '@popperjs/core'

export interface Marker {
  path: Path
  type: string
  level?: string
  item: {message: string}
}

export {Placement}

export interface MediaDimensions {
  width?: number
  height?: number
  fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min'
  aspect?: number
}
