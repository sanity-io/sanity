import {Placement} from '@popperjs/core'

// @todo: import these from `@sanity/field`?
export type KeyedSegment = {
  _key: string
}
export type PathSegment = string | number | KeyedSegment
export type Path = PathSegment[]

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
