import {Path, PathSegment} from '@sanity/types'
import {
  SetIfMissingPatch,
  InsertPatch,
  InsertPosition,
  SetPatch,
  UnsetPatch,
  IncPatch,
  DecPatch,
} from './types'

export function setIfMissing(value: any, path: Path = []): SetIfMissingPatch {
  return {
    type: 'setIfMissing',
    path,
    value,
  }
}

export function insert(items: any[], position: InsertPosition, path: Path = []): InsertPatch {
  return {
    type: 'insert',
    path,
    position,
    items,
  }
}

export function set(value: any, path: Path = []): SetPatch {
  return {type: 'set', path, value}
}

export function unset(path: Path = []): UnsetPatch {
  return {type: 'unset', path}
}

export function inc(amount = 1, path: Path = []): IncPatch {
  return {type: 'inc', path, value: amount}
}

export function dec(amount = 1, path: Path = []): DecPatch {
  return {type: 'dec', path, value: amount}
}

export function prefixPath<T extends {path: Path}>(patch: T, segment: PathSegment): T {
  return {
    ...patch,
    path: [segment, ...patch.path],
  }
}
