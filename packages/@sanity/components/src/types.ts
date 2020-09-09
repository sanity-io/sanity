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

export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'

export interface MediaDimensions {
  width?: number
  height?: number
  fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min'
  aspect?: number
}
