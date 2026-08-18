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
  // oxlint-disable-next-line typescript/no-deprecated -- public compatibility export
  validateDocumentWithWorkspace,
  type ValidationSource,
} from './validateDocument'
