import {type Path, type PathSegment} from '@sanity/types'

import {
  type FormDecPatch,
  type FormDiffMatchPatch,
  type FormIncPatch,
  type FormInsertPatch,
  type FormInsertPatchPosition,
  type FormSetIfMissingPatch,
  type FormSetPatch,
  type FormUnsetPatch,
} from './types'

/** @internal */
export const SANITY_PATCH_TYPE = Symbol.for('sanity.patch')

/**
 * Marks a form patch as targeting the document root, regardless of where
 * in the form tree it was emitted. Patches carrying this symbol skip
 * the per-field `prefixPath` calls that normally prepend the field name
 * to the patch path.
 *
 * This is intentionally a Symbol so it:
 *  - cannot be set by external plugin code (requires the exact reference)
 *  - does not serialize to JSON (automatically stripped on the wire)
 *  - does not pollute the patch type surface
 *
 * INTERNAL USE ONLY — not exported from the public API.
 *
 * --- Design note: Alternative considered (Option B) ---
 * A separate `documentPatches` array on PatchEvent, where `prefixAll`
 * only processes the main `patches` array and passes `documentPatches`
 * through unchanged. Both arrays merge at `useDocumentForm` before
 * `patch.execute`. More explicit in the type system but requires
 * PatchEvent constructor/method changes. We chose the Symbol approach
 * (Option A) for simplicity — revisit if the number of document-level
 * patch use cases grows beyond comment ranges.
 *
 * @internal
 */
export const SANITY_DOCUMENT_PATCH = Symbol.for('sanity.documentPatch')

/**
 * @hidden
 * @beta */
export function setIfMissing(value: any, path: Path = []): FormSetIfMissingPatch {
  return {
    patchType: SANITY_PATCH_TYPE,
    type: 'setIfMissing',
    path,
    value,
  }
}

/**
 * @hidden
 * @beta */
export function insert(
  items: any[],
  position: FormInsertPatchPosition,
  path: Path = [],
): FormInsertPatch {
  return {
    patchType: SANITY_PATCH_TYPE,
    type: 'insert',
    path,
    position,
    items,
  }
}

/**
 * @hidden
 * @beta */
export function set(value: any, path: Path = []): FormSetPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'set', path, value}
}

/**
 * @hidden
 * @beta */
export function unset(path: Path = []): FormUnsetPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'unset', path}
}

/**
 * @hidden
 * @beta */
export function diffMatchPatch(value: string, path: Path = []): FormDiffMatchPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'diffMatchPatch', path, value}
}

/**
 * @hidden
 * @beta */
export function inc(amount = 1, path: Path = []): FormIncPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'inc', path, value: amount}
}

/**
 * @hidden
 * @beta */
export function dec(amount = 1, path: Path = []): FormDecPatch {
  return {patchType: SANITY_PATCH_TYPE, type: 'dec', path, value: amount}
}

/**
 * @internal
 *
 * Wraps a form patch so it targets the document root.
 * The returned patch will pass through `prefixPath` unchanged.
 */
export function documentPatch<T extends FormPatch>(patch: T): T & {[SANITY_DOCUMENT_PATCH]: true} {
  return Object.assign(patch, {[SANITY_DOCUMENT_PATCH]: true})
}

/** @internal */
export function prefixPath<T extends {path: Path}>(patch: T, segment: PathSegment): T {
  if (SANITY_DOCUMENT_PATCH in patch) return patch
  return {
    ...patch,
    path: [segment, ...patch.path],
  }
}
