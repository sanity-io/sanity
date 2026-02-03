import {type ClientError} from '@sanity/client'

import {FORBIDDEN_RESPONSE_TEXT} from '../constants'

// this is used in place of `instanceof` so the matching can be more robust and
// won't have any issues with dual packages etc
// https://nodejs.org/api/packages.html#dual-package-hazard
function isClientError(e: unknown): e is ClientError {
  if (typeof e !== 'object') return false
  if (!e) return false
  return 'statusCode' in e && 'response' in e
}

export default function getErrorMessage(err: unknown): string {
  let message

  if (isClientError(err)) {
    // The request was made and the server responded with a status code
    if (err.response.statusCode === 403) {
      message = FORBIDDEN_RESPONSE_TEXT
    } else {
      message = err.message
    }
  } else {
    if (err instanceof Error) {
      message = err.message
    }
    message = String(err)
  }

  return message
}
