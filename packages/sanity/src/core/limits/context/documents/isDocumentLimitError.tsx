import {ClientError} from '@sanity/client'

/**
 * @internal
 */
export const isDocumentLimitError = (error: unknown) : React.JSX.Element => {
  if (error instanceof ClientError) {
    return error.response.body.error.type === 'documentLimitExceededError'
  }
  return false
}
