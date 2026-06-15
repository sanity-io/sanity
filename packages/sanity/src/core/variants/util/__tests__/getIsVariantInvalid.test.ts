import {describe, expect, it} from 'vitest'

import {VARIANT_DOCUMENTS_PATH} from '../../store/constants'
import {type EditableSystemVariant} from '../../types'
import {getIsVariantInvalid, getVariantTitleValue} from '../getIsVariantInvalid'

function createVariant(overrides: Partial<EditableSystemVariant> = {}): EditableSystemVariant {
  return {
    _id: `${VARIANT_DOCUMENTS_PATH}.test`,
    _type: 'system.variant',
    conditions: {},
    priority: 0,
    metadata: {title: '', description: []},
    ...overrides,
  }
}

describe('getIsVariantInvalid', () => {
  it('requires a non-empty title and at least one condition', () => {
    expect(getIsVariantInvalid(createVariant())).toBe(true)
    expect(
      getIsVariantInvalid(
        createVariant({
          metadata: {title: 'Audience', description: []},
        }),
      ),
    ).toBe(true)
    expect(
      getIsVariantInvalid(
        createVariant({
          conditions: {audience: 'loyal'},
        }),
      ),
    ).toBe(true)
    expect(
      getIsVariantInvalid(
        createVariant({
          metadata: {title: 'Audience', description: []},
          conditions: {'': ''},
        }),
      ),
    ).toBe(true)
    expect(
      getIsVariantInvalid(
        createVariant({
          metadata: {title: 'Audience', description: []},
          conditions: {audience: ''},
        }),
      ),
    ).toBe(true)
    expect(
      getIsVariantInvalid(
        createVariant({
          metadata: {title: 'Audience', description: []},
          conditions: {audience: 'loyal'},
        }),
      ),
    ).toBe(false)
  })

  it('trims whitespace from the title', () => {
    expect(getVariantTitleValue(createVariant({metadata: {title: '  ', description: []}}))).toBe('')
  })
})
