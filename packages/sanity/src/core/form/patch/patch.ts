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

/** @internal */
export const SANITY_PATCH_TYPE = Symbol.for('sanity.patch')

/** @beta */
export function setIfMissing(value: any, path: Path = []): FormSetIfMissingPatch {
  return {
    patchType: SANITY_PATCH_TYPE,
    type: 'setIfMissing',
    path,
    value,
  }
}

/** @beta */
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

/** @beta */
export function set(value: any, path: Path = []): FormSetPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'set', path, value}
}

/** @beta */
export function unset(path: Path = []): FormUnsetPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'unset', path}
}

/** @beta */
export function diffMatchPatch(value: string, path: Path = []): FormDiffMatchPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'diffMatchPatch', path, value}
}

/** @beta */
export function inc(amount = 1, path: Path = []): FormIncPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'inc', path, value: amount}
}

/** @beta */
export function dec(amount = 1, path: Path = []): FormDecPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'dec', path, value: amount}
}

/** @internal */
export function prefixPath<T extends {path: Path}>(patch: T, segment: PathSegment): T {
  return {
    ...patch,
    path: [segment, ...patch.path],
  }
}
