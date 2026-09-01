// oxlint-disable-next-line import/no-unassigned-import -- side effect: keeps ValidationContext module augmentations on the public type surface
import './types'

export {
  type BuiltInValidationMarkerCode,
  type DocumentValidationMarker,
  type ValidationMarkerCode,
  validationMarkerCodes,
} from './codes'
export {
  validateDocument,
  type ValidateDocumentOptions,
  type ValidateDocumentWorkspaceOptions,
  type ValidationClient,
  // oxlint-disable-next-line typescript/no-deprecated -- public compatibility export
  validateDocumentWithWorkspace,
  type ValidationSchema,
  type ValidationSource,
} from './validateDocument'
