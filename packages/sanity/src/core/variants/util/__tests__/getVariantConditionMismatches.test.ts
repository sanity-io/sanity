import {describe, expect, it} from 'vitest'

import {getVariantConditionMismatches} from '../getVariantConditionMismatches'
import {type NormalizedVariantConditionMap} from '../normalizeVariantConditions'

const definitions: NormalizedVariantConditionMap[] = [
  {
    name: 'audience',
    title: 'Audience',
    values: [
      {value: 'loyal', title: 'Loyal customers'},
      {value: 'new', title: 'New visitors'},
    ],
  },
  {
    name: 'locale',
    title: 'Locale',
    values: [{value: 'en-US', title: 'en-US'}],
  },
]

describe('getVariantConditionMismatches', () => {
  it('returns no mismatches when every stored pair is in the list', () => {
    expect(
      getVariantConditionMismatches({audience: 'loyal', locale: 'en-US'}, definitions),
    ).toEqual([])
  })

  it('returns no mismatches for empty conditions', () => {
    expect(getVariantConditionMismatches({}, definitions)).toEqual([])
  })

  it('allows unused configured keys', () => {
    expect(getVariantConditionMismatches({audience: 'loyal'}, definitions)).toEqual([])
  })

  it('flags an unknown key', () => {
    expect(getVariantConditionMismatches({legacy: 'old-value'}, definitions)).toEqual([
      {key: 'legacy', value: 'old-value', type: 'unknown-key'},
    ])
  })

  it('flags an unknown value for a known key', () => {
    expect(getVariantConditionMismatches({audience: 'vip'}, definitions)).toEqual([
      {key: 'audience', value: 'vip', type: 'unknown-value'},
    ])
  })

  it('flags both unknown keys and unknown values', () => {
    expect(
      getVariantConditionMismatches({audience: 'vip', legacy: 'old-value'}, definitions),
    ).toEqual([
      {key: 'audience', value: 'vip', type: 'unknown-value'},
      {key: 'legacy', value: 'old-value', type: 'unknown-key'},
    ])
  })
})
