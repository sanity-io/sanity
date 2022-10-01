/** @public */
export type KeyedSegment = {_key: string}

/** @public */
export type IndexTuple = [number | '', number | '']

/** @public */
export type PathSegment = string | number | KeyedSegment | IndexTuple

/** @public */
export type Path = PathSegment[]
