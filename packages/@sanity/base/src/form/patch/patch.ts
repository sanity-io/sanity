/* eslint-disable camelcase */

import {Path, PathSegment} from '@sanity/types'
import {
  FIXME_SetIfMissingPatch,
  FIXME_InsertPatch,
  FIXME_InsertPatchPosition,
  FIXME_SetPatch,
  FIXME_UnsetPatch,
  FIXME_IncPatch,
  FIXME_DecPatch,
} from './types'

export function setIfMissing(value: any, path: Path = []): FIXME_SetIfMissingPatch {
  return {
    type: 'setIfMissing',
    path,
    value,
  }
}

export function insert(
  items: any[],
  position: FIXME_InsertPatchPosition,
  path: Path = []
): FIXME_InsertPatch {
  return {
    type: 'insert',
    path,
    position,
    items,
  }
}

export function set(value: any, path: Path = []): FIXME_SetPatch {
  return {type: 'set', path, value}
}

export function unset(path: Path = []): FIXME_UnsetPatch {
  return {type: 'unset', path}
}

export function inc(amount = 1, path: Path = []): FIXME_IncPatch {
  return {type: 'inc', path, value: amount}
}

export function dec(amount = 1, path: Path = []): FIXME_DecPatch {
  return {type: 'dec', path, value: amount}
}

export function prefixPath<T extends {path: Path}>(patch: T, segment: PathSegment): T {
  return {
    ...patch,
    path: [segment, ...patch.path],
  }
}
