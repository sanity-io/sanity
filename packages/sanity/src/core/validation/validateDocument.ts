import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type SanityDocument, type ValidationMarker} from '@sanity/types'
import {
  validateDocumentInternal,
  type ValidateDocumentInternalOptions,
} from '@sanity/validation/_internal'

import {type SourceClientOptions, type Workspace} from '../config'

export {
  resolveTypeForArrayItem,
  validateDocumentObservable,
  type ValidateDocumentObservableOptions,
  validateItem,
} from '@sanity/validation/_internal'

/** @beta */
export interface ValidateDocumentOptions {
  /** The document to be validated. */
  document: SanityDocument

  /** The workspace and compiled schema used to validate the document. */
  workspace: Workspace

  /** Optional reference existence lookup override. */
  getDocumentExists?: (options: {id: string}) => Promise<boolean>

  /**
   * Factory used to get the client passed to custom validators.
   *
   * @deprecated For internal use only
   */
  getClient?: (clientOptions: SourceClientOptions) => SanityClient

  /** Validation environment exposed to custom validators. */
  environment?: 'cli' | 'studio'

  /** Maximum concurrently executing custom validators. Defaults to 5. */
  maxCustomValidationConcurrency?: number

  /**
   * The amount of allowed inflight fetch requests at once for this validation.
   * You may need to up this value if you have complex custom validations that require many
   * `client.fetch` requests at once. It's possible for a custom validator to
   * stall if there are not enough concurrent fetch requests available to fulfill
   * the custom validation. Must be a positive integer. This is 25 by default.
   */
  maxFetchConcurrency?: number

  /** Current user used when resolving conditional hidden fields. */
  currentUser?: Omit<CurrentUser, 'role'> | null
}

/**
 * Validates a document against the schema in the given workspace.
 *
 * @beta
 */
export function validateDocument({
  document,
  workspace,
  getClient = workspace.getClient,
  getDocumentExists,
  environment = 'studio',
  maxCustomValidationConcurrency,
  maxFetchConcurrency,
  currentUser,
}: ValidateDocumentOptions): Promise<ValidationMarker[]> {
  const options: ValidateDocumentInternalOptions = {
    currentUser,
    document,
    environment,
    getClient,
    getDocumentExists,
    i18n: workspace.i18n,
    maxCustomValidationConcurrency,
    maxFetchConcurrency,
    schema: workspace.schema,
  }

  return validateDocumentInternal(options)
}
