import {ClientError} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {isUnsupportedScoreExpressionError} from './isUnsupportedScoreExpressionError'

function clientErrorWithDetails(details: unknown) {
  return new ClientError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    headers: {},
    body: {error: details},
    url: 'https://api.sanity.io/v2024-01-01/data/query/test',
    method: 'GET',
  })
}

describe('isUnsupportedScoreExpressionError', () => {
  it('matches a validationError whose description reports an unsupported score() expression', () => {
    const error = clientErrorWithDetails({
      type: 'validationError',
      description:
        'score() function received unexpected expression: analytics.pageName match text::query($__query)',
    })

    expect(isUnsupportedScoreExpressionError(error)).toBe(true)
  })

  it('matches a queryParseError carrying the same description', () => {
    const error = clientErrorWithDetails({
      type: 'queryParseError',
      description: 'score() function received unexpected expression',
      query: '*[_type in $__types] | score(boost(...))',
      start: 10,
      end: 40,
    })

    expect(isUnsupportedScoreExpressionError(error)).toBe(true)
  })

  it('matches when the message carries the description but `details` is absent', () => {
    const error = new Error('score() function received unexpected expression')

    expect(isUnsupportedScoreExpressionError(error)).toBe(true)
  })

  it('does not match an unrelated validation error', () => {
    const error = clientErrorWithDetails({
      type: 'validationError',
      description: 'Complex perspectives are not supported for this version',
    })

    expect(isUnsupportedScoreExpressionError(error)).toBe(false)
  })

  it('does not match a plain error without the signature message', () => {
    expect(isUnsupportedScoreExpressionError(new Error('network error'))).toBe(false)
  })

  it('does not match non-error values', () => {
    expect(
      isUnsupportedScoreExpressionError('score() function received unexpected expression'),
    ).toBe(false)
    expect(isUnsupportedScoreExpressionError(undefined)).toBe(false)
    expect(isUnsupportedScoreExpressionError(null)).toBe(false)
  })
})
