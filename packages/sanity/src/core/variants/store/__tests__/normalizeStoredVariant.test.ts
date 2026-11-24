import {describe, expect, it} from 'vitest'

import {createMockVariant} from '../../__fixtures__/createMockVariant'
import {legacyVariantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {type StoredSystemVariant} from '../../types'
import {normalizeStoredVariant} from '../normalizeStoredVariant'

function storedVariant(conditions: StoredSystemVariant['conditions']): StoredSystemVariant {
  return {...createMockVariant('stored'), conditions}
}

describe('normalizeStoredVariant', () => {
  it('keeps array conditions and does not flag the definition', () => {
    const conditions = [
      {_key: 'k1', condition: 'audience', value: 'loyal'},
      {_key: 'k2', condition: 'country', value: 'uk'},
    ]

    expect(normalizeStoredVariant(storedVariant(conditions))).toMatchObject({
      conditions,
      needsMigration: false,
    })
  })

  it('converts legacy object conditions to the array shape and flags the definition', () => {
    expect(normalizeStoredVariant(legacyVariantAlphaAudience)).toMatchObject({
      _id: legacyVariantAlphaAudience._id,
      conditions: [
        {_key: 'audience', condition: 'audience', value: 'alpha'},
        {_key: 'locale', condition: 'locale', value: 'en-US'},
      ],
      needsMigration: true,
    })
  })

  it('derives the same keys every time a legacy definition is normalized', () => {
    const first = normalizeStoredVariant(legacyVariantAlphaAudience)
    const second = normalizeStoredVariant(legacyVariantAlphaAudience)

    expect(second.conditions).toEqual(first.conditions)
  })

  it('treats a definition without conditions as migrated with no conditions', () => {
    expect(normalizeStoredVariant(storedVariant(undefined))).toMatchObject({
      conditions: [],
      needsMigration: false,
    })
    expect(normalizeStoredVariant(storedVariant(null))).toMatchObject({
      conditions: [],
      needsMigration: false,
    })
  })

  it('treats an empty legacy object as needing migration', () => {
    expect(normalizeStoredVariant(storedVariant({}))).toMatchObject({
      conditions: [],
      needsMigration: true,
    })
  })

  it('drops malformed entries from both shapes', () => {
    const malformedArray = JSON.parse(
      '[{"_key":"k1","condition":"audience","value":"loyal"},{"_key":"k2","condition":"country"},null,"uk"]',
    )
    const malformedObject = JSON.parse('{"audience":"loyal","country":42}')

    expect(normalizeStoredVariant(storedVariant(malformedArray)).conditions).toEqual([
      {_key: 'k1', condition: 'audience', value: 'loyal'},
    ])
    expect(normalizeStoredVariant(storedVariant(malformedObject)).conditions).toEqual([
      {_key: 'audience', condition: 'audience', value: 'loyal'},
    ])
  })

  it('keys array entries without a key by their condition name', () => {
    const unkeyed = JSON.parse('[{"condition":"audience","value":"loyal"}]')

    expect(normalizeStoredVariant(storedVariant(unkeyed)).conditions).toEqual([
      {_key: 'audience', condition: 'audience', value: 'loyal'},
    ])
  })
})
