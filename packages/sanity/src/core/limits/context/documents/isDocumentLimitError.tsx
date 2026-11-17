import {ClientError} from '@sanity/client'

import {isRecord} from '../../../util/isRecord'

/**
 * Error boundaries and error channel subscribers call this with whatever they caught, so it must
 * not throw for response bodies that are not JSON objects, such as a plain text 429.
 *
 * @internal
 */
export const isDocumentLimitError = (error: unknown) => {
  if (!(error instanceof ClientError)) {
    return false
  }
  const body: unknown = error.response?.body
  return isRecord(body) && isRecord(body.error) && body.error.type === 'documentLimitExceededError'
}
