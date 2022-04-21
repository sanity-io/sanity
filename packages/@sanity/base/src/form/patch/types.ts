/* eslint-disable camelcase */

import {Path} from '@sanity/types'

/**
 * @internal
 */
export type FIXME_PatchJSONValue =
  | number
  | string
  | boolean
  | {[key: string]: FIXME_PatchJSONValue}
  | FIXME_PatchJSONValue[]

/**
 * @internal
 */
export type FIXME_PatchOrigin = 'remote' | 'local' | 'internal'

/**
 * @internal
 */
export type FIXME_SetPatch = {
  path: Path
  type: 'set'
  origin?: FIXME_PatchOrigin
  value: FIXME_PatchJSONValue
}

/**
 * @internal
 */
export type FIXME_IncPatch = {
  path: Path
  type: 'inc'
  origin?: FIXME_PatchOrigin
  value: FIXME_PatchJSONValue
}

/**
 * @internal
 */
export type FIXME_DecPatch = {
  path: Path
  type: 'dec'
  origin?: FIXME_PatchOrigin
  value: FIXME_PatchJSONValue
}

/**
 * @internal
 */
export type FIXME_SetIfMissingPatch = {
  path: Path
  origin?: FIXME_PatchOrigin
  type: 'setIfMissing'
  value: FIXME_PatchJSONValue
}

/**
 * @internal
 */
export type FIXME_UnsetPatch = {
  path: Path
  origin?: FIXME_PatchOrigin
  type: 'unset'
}

/**
 * @internal
 */
export type FIXME_InsertPatchPosition = 'before' | 'after'

/**
 * @internal
 */
export type FIXME_InsertPatch = {
  path: Path
  origin?: FIXME_PatchOrigin
  type: 'insert'
  position: FIXME_InsertPatchPosition
  items: FIXME_PatchJSONValue[]
}

/**
 * @internal
 */
export type FIXME_DiffMatchPatch = {
  path: Path
  type: 'diffMatchPatch'
  origin?: FIXME_PatchOrigin
  value: string
}

/**
 * @internal
 */
export type FIXME_Patch =
  | FIXME_SetPatch
  | FIXME_SetIfMissingPatch
  | FIXME_UnsetPatch
  | FIXME_InsertPatch
  | FIXME_DiffMatchPatch
