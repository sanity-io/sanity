// @flow

import type {Path, PathSegment} from '../typedefs/path'

type HasPath = {
  path: Path
}
type HasOrigin = {
  origin?: 'remote' | 'local'
}

type SetPatch = HasPath & HasOrigin & {
  type: 'set',
  value: any
}

type SetIfMissingPatch = HasPath & HasOrigin & {
  type: 'setIfMissing',
  value: any
}

type UnsetPatch = HasPath & HasOrigin & {
  type: 'unset',
}

type InsertPosition = 'before' | 'after'
type InsertPatch = HasPath & HasOrigin & {
  type: 'insert',
  position: InsertPosition,
  items: any[]
}

export type Patch = SetPatch | SetIfMissingPatch | UnsetPatch | InsertPatch

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
