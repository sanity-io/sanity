import {ClientError} from '@sanity/client'

/**
 * @internal
 */
export const isDocumentLimitError = (error: unknown): boolean => {
  if (error instanceof ClientError) {
    return error.response.body.error.type === 'documentLimitExceededError'
  }
  return false
}
