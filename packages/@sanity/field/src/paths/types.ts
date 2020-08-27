/**
 * Paths
 */
export type KeyedSegment = {_key: string}
export type PathSegment = string | number | KeyedSegment
export type Path = PathSegment[]
