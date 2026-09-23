import {
  type ValidateDocumentWorkspaceOptions,
  validateDocumentWithWorkspace,
} from '@sanity/validation'

export {
  validateDocumentWithReferences,
  type ValidationStatus,
} from './validateDocumentWithReferences'

/** @beta */
export type ValidateDocumentOptions = ValidateDocumentWorkspaceOptions

/**
 * Validates a document against the schema in the given workspace.
 *
 * @beta
 */
export function validateDocument(options: ValidateDocumentOptions) {
  // oxlint-disable-next-line typescript/no-deprecated -- wraps the compatibility API without deprecating the stable Studio export
  return validateDocumentWithWorkspace(options)
}
