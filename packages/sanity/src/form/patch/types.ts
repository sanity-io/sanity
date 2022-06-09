/* eslint-disable camelcase */

import {Path} from '@sanity/types'

/**
 * @alpha
 */
export type FormPatchJSONValue =
  | number
  | string
  | boolean
  | {[key: string]: FormPatchJSONValue}
  | FormPatchJSONValue[]

/**
 * @alpha
 */
export type FormPatchOrigin = 'remote' | 'local' | 'internal'

/**
 * @alpha
 */
export type FormSetPatch = {
  path: Path
  type: 'set'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 * @alpha
 */
export type FormIncPatch = {
  path: Path
  type: 'inc'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 * @alpha
 */
export type FormDecPatch = {
  path: Path
  type: 'dec'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 * @alpha
 */
export type FormSetIfMissingPatch = {
  path: Path
  origin?: FormPatchOrigin
  type: 'setIfMissing'
  value: FormPatchJSONValue
}

/**
 * @alpha
 */
export type FormUnsetPatch = {
  path: Path
  origin?: FormPatchOrigin
  type: 'unset'
}

/**
 * @alpha
 */
export type FormInsertPatchPosition = 'before' | 'after'

/**
 * @alpha
 */
export type FormInsertPatch = {
  path: Path
  origin?: FormPatchOrigin
  type: 'insert'
  position: FormInsertPatchPosition
  items: FormPatchJSONValue[]
}

/**
 * @alpha
 */
export type FormDiffMatchPatch = {
  path: Path
  type: 'diffMatchPatch'
  origin?: FormPatchOrigin
  value: string
}

/**
 * @alpha
 */
export type FormPatch =
  | FormSetPatch
  | FormSetIfMissingPatch
  | FormUnsetPatch
  | FormInsertPatch
  | FormDiffMatchPatch

/**
 * @alpha
 */
export type PatchArg = FormPatch | FormPatch[]
