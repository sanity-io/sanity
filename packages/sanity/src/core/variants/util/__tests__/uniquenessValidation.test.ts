import {describe, expect, it} from 'vitest'

import {VARIANT_DOCUMENTS_PATH} from '../../store/constants'
import {type EditableSystemVariant} from '../../types'
import {getVariantUniquenessValidation} from '../uniquenessValidation'

function createVariant(
  id: string,
  overrides: Partial<Omit<EditableSystemVariant, '_id'>> = {},
): EditableSystemVariant {
  return {
    _id: `${VARIANT_DOCUMENTS_PATH}.${id}`,
    _type: 'system.variant',
    conditions: {},
    priority: 0,
    metadata: {title: '', description: []},
    ...overrides,
  }
}

describe('getVariantUniquenessValidation', () => {
  it('matches another variant with the same title', () => {
    const existing = createVariant('existing', {
      metadata: {title: 'Loyal customers', description: []},
    })
    const candidate = createVariant('candidate', {
      metadata: {title: 'Loyal customers', description: []},
    })

    expect(getVariantUniquenessValidation(candidate, [existing]).duplicateTitleOf).toBe(existing)
  })

  it('matches titles case-insensitively and ignores surrounding whitespace', () => {
    const existing = createVariant('existing', {
      metadata: {title: 'Loyal Customers', description: []},
    })
    const candidate = createVariant('candidate', {
      metadata: {title: '  loyal customers  ', description: []},
    })

    expect(getVariantUniquenessValidation(candidate, [existing]).duplicateTitleOf).toBe(existing)
  })

  it('does not match different titles', () => {
    const existing = createVariant('existing', {
      metadata: {title: 'Loyal customers', description: []},
    })
    const candidate = createVariant('candidate', {
      metadata: {title: 'New customers', description: []},
    })

    expect(getVariantUniquenessValidation(candidate, [existing]).duplicateTitleOf).toBeUndefined()
  })

  it('never matches empty titles', () => {
    const existing = createVariant('existing', {metadata: {title: '   ', description: []}})
    const candidate = createVariant('candidate', {metadata: {title: '', description: []}})

    expect(getVariantUniquenessValidation(candidate, [existing]).duplicateTitleOf).toBeUndefined()
  })

  it('matches another variant with an identical condition set', () => {
    const existing = createVariant('existing', {conditions: {audience: 'loyal'}})
    const candidate = createVariant('candidate', {conditions: {audience: 'loyal'}})

    expect(getVariantUniquenessValidation(candidate, [existing]).duplicateConditionsOf).toBe(
      existing,
    )
  })

  it('does not match when the candidate has an extra condition', () => {
    const existing = createVariant('existing', {conditions: {audience: 'loyal'}})
    const candidate = createVariant('candidate', {conditions: {audience: 'loyal', country: 'us'}})

    expect(
      getVariantUniquenessValidation(candidate, [existing]).duplicateConditionsOf,
    ).toBeUndefined()
  })

  it('does not match when the existing variant has an extra condition', () => {
    const existing = createVariant('existing', {conditions: {audience: 'loyal', country: 'us'}})
    const candidate = createVariant('candidate', {conditions: {audience: 'loyal'}})

    expect(
      getVariantUniquenessValidation(candidate, [existing]).duplicateConditionsOf,
    ).toBeUndefined()
  })

  it('does not match when a condition value differs', () => {
    const existing = createVariant('existing', {conditions: {audience: 'loyal', country: 'us'}})
    const candidate = createVariant('candidate', {conditions: {audience: 'loyal', country: 'no'}})

    expect(
      getVariantUniquenessValidation(candidate, [existing]).duplicateConditionsOf,
    ).toBeUndefined()
  })

  it('matches regardless of condition key order', () => {
    const existing = createVariant('existing', {conditions: {audience: 'loyal', country: 'us'}})
    const candidate = createVariant('candidate', {conditions: {country: 'us', audience: 'loyal'}})

    expect(getVariantUniquenessValidation(candidate, [existing]).duplicateConditionsOf).toBe(
      existing,
    )
  })

  it('never matches empty condition sets', () => {
    const existing = createVariant('existing', {conditions: {}})
    const candidate = createVariant('candidate', {conditions: {}})

    expect(
      getVariantUniquenessValidation(candidate, [existing]).duplicateConditionsOf,
    ).toBeUndefined()
  })

  it('excludes the candidate itself so editing an unchanged variant never matches', () => {
    const stored = createVariant('stored', {
      conditions: {audience: 'loyal'},
      metadata: {title: 'Loyal customers', description: []},
    })
    const edited = createVariant('stored', {
      conditions: {audience: 'loyal'},
      metadata: {title: 'Loyal customers', description: []},
    })

    expect(getVariantUniquenessValidation(edited, [stored])).toEqual({
      duplicateTitleOf: undefined,
      duplicateConditionsOf: undefined,
    })
  })

  it('reports title and condition duplicates from different variants independently', () => {
    const sameTitle = createVariant('same-title', {
      conditions: {audience: 'vip'},
      metadata: {title: 'Loyal customers', description: []},
    })
    const sameConditions = createVariant('same-conditions', {
      conditions: {audience: 'loyal'},
      metadata: {title: 'Another title', description: []},
    })
    const candidate = createVariant('candidate', {
      conditions: {audience: 'loyal'},
      metadata: {title: 'Loyal customers', description: []},
    })

    expect(getVariantUniquenessValidation(candidate, [sameTitle, sameConditions])).toEqual({
      duplicateTitleOf: sameTitle,
      duplicateConditionsOf: sameConditions,
    })
  })
})
