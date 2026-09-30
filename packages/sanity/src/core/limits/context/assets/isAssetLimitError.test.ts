import {ClientError} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {isAssetLimitError} from './isAssetLimitError'

function clientError(statusCode: number, body: unknown) {
  return new ClientError({
    body,
    headers: {},
    method: 'POST',
    statusCode,
    url: 'https://abc123.api.sanity.io/v2025-02-19/assets/images/production',
  })
}

describe('isAssetLimitError', () => {
  it('recognizes the plan limit error of the API', () => {
    expect(
      isAssetLimitError(clientError(402, {error: 'plan_limit_reached', message: 'Limit reached'})),
    ).toBe(true)
  })

  it('rejects other JSON error bodies', () => {
    expect(isAssetLimitError(clientError(413, {error: 'Payload Too Large'}))).toBe(false)
  })

  it.each([
    ['a plain text body', 'Request Entity Too Large'],
    ['an empty body', ''],
    ['no body', undefined],
    ['a null body', null],
  ])('rejects a client error with %s without throwing', (_, body) => {
    expect(isAssetLimitError(clientError(413, body))).toBe(false)
  })

  it('rejects errors that are not client errors', () => {
    expect(isAssetLimitError(new Error('plan_limit_reached'))).toBe(false)
    expect(isAssetLimitError(undefined)).toBe(false)
  })
})
