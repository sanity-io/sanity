import {describe, expect, it} from 'vitest'

import {isVariantId} from './types'

describe('isVariantId', () => {
  it.each(['_.variants.XBeVtHmN', '_.variants.abc_d', '_.variants.ABC_01-'])(
    'returns true for variant id %j',
    (id) => {
      expect(isVariantId(id)).toBe(true)
    },
  )

  it.each([
    'XBeVtHmN',
    'drafts.abc',
    '_.abc',
    '_.variants.',
    '_.variants',
    'variants.XBeVtHmN',
    '_.variants.abc!',
    ' _.variants.XBeVtHmN',
    '_.variants.XBeVtHmN ',
  ])('returns false for non-variant string %j', (value) => {
    expect(isVariantId(value)).toBe(false)
  })

  it.each([undefined, null, 42, {}, ['_.variants.XBeVtHmN']])(
    'returns false for non-string value %j',
    (value) => {
      expect(isVariantId(value)).toBe(false)
    },
  )
})
