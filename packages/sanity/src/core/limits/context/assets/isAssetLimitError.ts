import {ClientError} from '@sanity/client'

/**
 * @internal
 */
export const isAssetLimitError = (error: unknown) => {
  if (error instanceof ClientError) {
    return error.response.body.error === 'plan_limit_reached'
  }
  return false
}
