/* eslint-disable camelcase */

import {Path} from '@sanity/types'

/**
 * @internal
 */
export type FormPatchJSONValue =
  | number
  | string
  | boolean
  | {[key: string]: FormPatchJSONValue}
  | FormPatchJSONValue[]

/**
 * @internal
 */
export type FormPatchOrigin = 'remote' | 'local' | 'internal'

/**
 * @internal
 */
export type FormSetPatch = {
  path: Path
  type: 'set'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 * @internal
 */
export type FormIncPatch = {
  path: Path
  type: 'inc'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 * @internal
 */
export type FormDecPatch = {
  path: Path
  type: 'dec'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 * @internal
 */
export type FormSetIfMissingPatch = {
  path: Path
  origin?: FormPatchOrigin
  type: 'setIfMissing'
  value: FormPatchJSONValue
}

/**
 * @internal
 */
export type FormUnsetPatch = {
  path: Path
  origin?: FormPatchOrigin
  type: 'unset'
}

/**
 * @internal
 */
export type FormInsertPatchPosition = 'before' | 'after'

/**
 * @internal
 */
export type FormInsertPatch = {
  path: Path
  origin?: FormPatchOrigin
  type: 'insert'
  position: FormInsertPatchPosition
  items: FormPatchJSONValue[]
}

/**
 * @internal
 */
export type FormDiffMatchPatch = {
  path: Path
  type: 'diffMatchPatch'
  origin?: FormPatchOrigin
  value: string
}

/**
 * @internal
 */
export type FormPatch =
  | FormSetPatch
  | FormSetIfMissingPatch
  | FormUnsetPatch
  | FormInsertPatch
  | FormDiffMatchPatch
