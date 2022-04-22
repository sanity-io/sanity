/* eslint-disable camelcase */

import {Path, PathSegment} from '@sanity/types'
import {
  FormSetIfMissingPatch,
  FormInsertPatch,
  FormInsertPatchPosition,
  FormSetPatch,
  FormUnsetPatch,
  FormIncPatch,
  FormDecPatch,
} from './types'

export function setIfMissing(value: any, path: Path = []): FormSetIfMissingPatch {
  return {
    type: 'setIfMissing',
    path,
    value,
  }
}

export function insert(
  items: any[],
  position: FormInsertPatchPosition,
  path: Path = []
): FormInsertPatch {
  return {
    type: 'insert',
    path,
    position,
    items,
  }
}

export function set(value: any, path: Path = []): FormSetPatch {
  return {type: 'set', path, value}
}

export function unset(path: Path = []): FormUnsetPatch {
  return {type: 'unset', path}
}

export function inc(amount = 1, path: Path = []): FormIncPatch {
  return {type: 'inc', path, value: amount}
}

export function dec(amount = 1, path: Path = []): FormDecPatch {
  return {type: 'dec', path, value: amount}
}

export function prefixPath<T extends {path: Path}>(patch: T, segment: PathSegment): T {
  return {
    ...patch,
    path: [segment, ...patch.path],
  }
}
