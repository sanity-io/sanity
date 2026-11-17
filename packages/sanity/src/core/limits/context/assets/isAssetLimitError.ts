import {ClientError} from '@sanity/client'

import {isRecord} from '../../../util/isRecord'

/**
 * @internal
 */
export const isAssetLimitError = (error: unknown) => {
  if (!(error instanceof ClientError)) {
    return false
  }
  const body: unknown = error.response?.body
  return isRecord(body) && body.error === 'plan_limit_reached'
}
