/**
 * Paths
 */
export type KeyedSegment = {_key: string}
export type IndexTuple = [number | '', number | '']
export type PathSegment = string | number | KeyedSegment | IndexTuple
export type Path = PathSegment[]
