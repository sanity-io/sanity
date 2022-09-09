import type {Path} from '@sanity/types'

/**
 * @alpha
 */
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
export interface FormSetPatch extends FormPatchBase {
  path: Path
  type: 'set'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 * @alpha
 */
export interface FormIncPatch extends FormPatchBase {
  path: Path
  type: 'inc'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 * @alpha
 */
export interface FormDecPatch extends FormPatchBase {
  path: Path
  type: 'dec'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 * @alpha
 */
export interface FormSetIfMissingPatch extends FormPatchBase {
  path: Path
  origin?: FormPatchOrigin
  type: 'setIfMissing'
  value: FormPatchJSONValue
}

/**
 * @alpha
 */
export interface FormUnsetPatch extends FormPatchBase {
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
export interface FormInsertPatch extends FormPatchBase {
  path: Path
  origin?: FormPatchOrigin
  type: 'insert'
  position: FormInsertPatchPosition
  items: FormPatchJSONValue[]
}

/**
 * @alpha
 */
export interface FormDiffMatchPatch extends FormPatchBase {
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
