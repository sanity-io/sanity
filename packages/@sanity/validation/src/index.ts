// oxlint-disable-next-line import/no-unassigned-import -- side effect: keeps ValidationContext module augmentations on the public type surface
import './types'

export {
  validateDocument,
  type ValidateDocumentOptions,
  type ValidateDocumentWorkspaceOptions,
  // oxlint-disable-next-line typescript/no-deprecated -- public compatibility export
  validateDocumentWithWorkspace,
  type ValidationSource,
} from './validateDocument'
