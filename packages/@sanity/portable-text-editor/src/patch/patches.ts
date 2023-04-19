import type {Path, PathSegment} from '@sanity/types'
import {makePatches, stringifyPatches} from '@sanity/diff-match-patch'

import type {
  SetIfMissingPatch,
  InsertPatch,
  InsertPosition,
  SetPatch,
  UnsetPatch,
  DiffMatchPatch,
} from '../types/patch'

export function setIfMissing(value: any, path: Path = []): SetIfMissingPatch {
  return {
    type: 'setIfMissing',
    path,
    value,
  }
}

export function diffMatchPatch(
  currentValue: string,
  nextValue: string,
  path: Path = []
): DiffMatchPatch {
  const patches = makePatches(currentValue, nextValue)
  const patch = stringifyPatches(patches)
  return {type: 'diffMatchPatch', path, value: patch}
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

export function prefixPath<T extends {path: Path}>(patch: T, segment: PathSegment): T {
  return {
    ...patch,
    path: [segment, ...patch.path],
  }
}
