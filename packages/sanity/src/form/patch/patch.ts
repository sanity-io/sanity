import type {Path, PathSegment} from '@sanity/types'
import type {
  FormSetIfMissingPatch,
  FormInsertPatch,
  FormInsertPatchPosition,
  FormSetPatch,
  FormUnsetPatch,
  FormIncPatch,
  FormDecPatch,
  FormDiffMatchPatch,
} from './types'

export const SANITY_PATCH_TYPE = Symbol.for('sanity.patch')

export function setIfMissing(value: any, path: Path = []): FormSetIfMissingPatch {
  return {
    patchType: SANITY_PATCH_TYPE,
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
    patchType: SANITY_PATCH_TYPE,
    type: 'insert',
    path,
    position,
    items,
  }
}

export function set(value: any, path: Path = []): FormSetPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'set', path, value}
}

export function unset(path: Path = []): FormUnsetPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'unset', path}
}

export function diffMatchPatch(value: string, path: Path = []): FormDiffMatchPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'diffMatchPatch', path, value}
}

export function inc(amount = 1, path: Path = []): FormIncPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'inc', path, value: amount}
}

export function dec(amount = 1, path: Path = []): FormDecPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'dec', path, value: amount}
}

export function prefixPath<T extends {path: Path}>(patch: T, segment: PathSegment): T {
  return {
    ...patch,
    path: [segment, ...patch.path],
  }
}
