import {ClientError} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {isDocumentLimitError} from './isDocumentLimitError'

function clientError(statusCode: number, body: unknown) {
  return new ClientError({
    body,
    headers: {},
    method: 'GET',
    statusCode,
    statusMessage: 'Too Many Requests',
    url: 'https://abc123.api.sanity.io/v2025-02-19/users/me',
  })
}

describe('isDocumentLimitError', () => {
  it('recognizes the document limit error of the API', () => {
    const error = clientError(403, {
      error: {type: 'documentLimitExceededError', description: 'Document limit exceeded'},
    })

    expect(isDocumentLimitError(error)).toBe(true)
  })

  it('rejects other JSON error bodies', () => {
    expect(isDocumentLimitError(clientError(429, {error: 'Too Many Requests'}))).toBe(false)
    expect(
      isDocumentLimitError(
        clientError(409, {error: {type: 'mutationError', description: 'Document already exists'}}),
      ),
    ).toBe(false)
  })

  it.each([
    ['a plain text body', 'Too Many Requests'],
    ['an empty body', ''],
    ['no body', undefined],
    ['a null body', null],
    ['an array body', [{type: 'documentLimitExceededError'}]],
  ])('rejects a client error with %s without throwing', (_, body) => {
    expect(isDocumentLimitError(clientError(429, body))).toBe(false)
  })

  it('rejects errors that are not client errors', () => {
    expect(isDocumentLimitError(new Error('documentLimitExceededError'))).toBe(false)
    expect(
      isDocumentLimitError({response: {body: {error: {type: 'documentLimitExceededError'}}}}),
    ).toBe(false)
    expect(isDocumentLimitError(undefined)).toBe(false)
  })
})
