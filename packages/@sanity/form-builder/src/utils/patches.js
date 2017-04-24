// @flow

type KeyedSegment = {
  _key: string
}

export type PathSegment = string | number | KeyedSegment

type Path = Array<PathSegment>

type HasPath = {
  path: Path
}
type SetPatch = HasPath & {
  type: 'set',
  value: any
}

type SetIfMissingPatch = HasPath & {
  type: 'setIfMissing',
  value: any
}

type UnsetPatch = HasPath & {
  type: 'unset',
}

type InsertPosition = 'before' | 'after'
type InsertPatch = HasPath & {
  type: 'insert',
  position: InsertPosition,
  items: any[]
}

export type Patch = SetPatch | SetIfMissingPatch | UnsetPatch | InsertPatch & {
  origin: 'remote' | 'local'
}

export function setIfMissing(value : any, path : Path = []) : SetIfMissingPatch {
  return {
    type: 'setIfMissing',
    path,
    value
  }
}

export function insert(items : any[], position: InsertPosition, path : Path = []) : InsertPatch {
  return {
    type: 'insert',
    path,
    position,
    items
  }
}

export function set(value : any, path : Path = []) : SetPatch {
  return {type: 'set', path, value}
}

export function unset(path : Path = []) : UnsetPatch {
  return {type: 'unset', path}
}

export function prefixPath<T: HasPath>(patch : T, segment : PathSegment) : T {
  return {
    ...patch,
    path: [segment, ...patch.path]
  }
}
