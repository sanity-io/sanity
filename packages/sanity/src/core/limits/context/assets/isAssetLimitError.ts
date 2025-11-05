import {ClientError} from '@sanity/client'

/**
 * @internal
 */
export const isAssetLimitError = (error: unknown) => {
  if (error instanceof ClientError) {
    // TODO: figure out the right error type
    return error.response.body.error.type === 'assetLimitExceededError'
  }
  return false
}
