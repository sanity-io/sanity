import {
  type FormPatchBase,
  type FormPatchJSONValue,
  type FormPatchOrigin,
  type Path,
} from '@sanity/types'

export type {
  FormDiffMatchPatch,
  FormInsertPatch,
  FormInsertPatchPosition,
  FormPatch,
  FormPatchBase,
  FormPatchJSONValue,
  FormPatchOrigin,
  FormSetIfMissingPatch,
  FormSetPatch,
  FormUnsetPatch,
  PatchArg,
} from '@sanity/types'

/**
 *
 * @hidden
 * @beta
 */
export interface FormIncPatch extends FormPatchBase {
  path: Path
  type: 'inc'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}

/**
 *
 * @hidden
 * @beta
 */
export interface FormDecPatch extends FormPatchBase {
  path: Path
  type: 'dec'
  origin?: FormPatchOrigin
  value: FormPatchJSONValue
}
