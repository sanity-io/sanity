import type {Path} from '@sanity/types'

/** @beta */
export interface FormPatchBase {
  /**
   * A property used to identify this as a Sanity patch type, eg "set", "unset", "insert", etc.
   * This allows us to potentially introduce new patch types in the future without breaking
   * existing code. This is an internal property/implementation detail and should not be used by
   * consumers.
   *
   * @internal
   */
  patchType: symbol
}

/**
 * @beta
 */
export type FormPatchJSONValue =
  | number
  | string
  | boolean
  | {[key: string]: FormPatchJSONValue}
  | FormPatchJSONValue[]

/**
 * @beta
 */
export type FormPatchOrigin = 'remote' | 'local' | 'internal'

/**
 * @beta
 */
export interface FormSetPatch extends FormPatchBase {
  path: Path
  type: 'set'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 * @beta
 */
export interface FormIncPatch extends FormPatchBase {
  path: Path
  type: 'inc'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 * @beta
 */
export interface FormDecPatch extends FormPatchBase {
  path: Path
  type: 'dec'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 * @beta
 */
export interface FormSetIfMissingPatch extends FormPatchBase {
  path: Path
  origin?: FormPatchOrigin
  type: 'setIfMissing'
  value: FormPatchJSONValue
}

/**
 * @beta
 */
export interface FormUnsetPatch extends FormPatchBase {
  path: Path
  origin?: FormPatchOrigin
  type: 'unset'
}

/**
 * @beta
 */
export type FormInsertPatchPosition = 'before' | 'after'

/**
 * @beta
 */
export interface FormInsertPatch extends FormPatchBase {
  path: Path
  origin?: FormPatchOrigin
  type: 'insert'
  position: FormInsertPatchPosition
  items: FormPatchJSONValue[]
}

/**
 * @beta
 */
export interface FormDiffMatchPatch extends FormPatchBase {
  path: Path
  type: 'diffMatchPatch'
  origin?: FormPatchOrigin
  value: string
}

/**
 * @beta
 */
export type FormPatch =
  | FormSetPatch
  | FormSetIfMissingPatch
  | FormUnsetPatch
  | FormInsertPatch
  | FormDiffMatchPatch

/**
 * @beta
 */
export type PatchArg = FormPatch | FormPatch[]
