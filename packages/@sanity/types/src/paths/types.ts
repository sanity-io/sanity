/** @beta */
export type KeyedSegment = {_key: string}

/** @beta */
export type IndexTuple = [number | '', number | '']

/** @beta */
export type PathSegment = string | number | KeyedSegment | IndexTuple

/** @beta */
export type Path = PathSegment[]
