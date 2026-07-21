import {describe, expect, it} from 'vitest'

import {createMockVariant} from '../../__fixtures__/createMockVariant'
import {type SystemVariant} from '../../types'
import {summarizeVariantDimensions} from '../summarizeVariantDimensions'
import {VARIANT_SET_METADATA_KEY} from '../variantSet'

function variant(
  id: string,
  conditions: Record<string, string>,
  extra: Partial<SystemVariant> = {},
): SystemVariant {
  return {...createMockVariant(id), conditions, ...extra}
}

function inSet(
  id: string,
  conditions: Record<string, string>,
  setId: string,
  setName: string,
  title?: string,
): SystemVariant {
  return variant(id, conditions, {
    metadata: {title, [VARIANT_SET_METADATA_KEY]: {id: setId, name: setName}},
  })
}

describe('summarizeVariantDimensions', () => {
  it('merges members of a set into one key -> values cluster', () => {
    const result = summarizeVariantDimensions([
      inSet('a', {market: 'us', device: 'mobile'}, 'set1', 'Summer'),
      inSet('b', {market: 'uk', device: 'desktop'}, 'set1', 'Summer'),
    ])

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({id: 'set1', name: 'Summer', kind: 'set', variantCount: 2})
    expect(result[0]!.dimensions).toEqual([
      {key: 'device', values: ['desktop', 'mobile']},
      {key: 'market', values: ['uk', 'us']},
    ])
  })

  it('lists standalone variants as their own single-member groups', () => {
    const result = summarizeVariantDimensions([
      variant('solo', {audience: 'vip'}, {metadata: {title: 'VIPs'}}),
    ])

    expect(result).toEqual([
      {
        id: '_.variants.solo',
        name: 'VIPs',
        kind: 'standalone',
        variantCount: 1,
        dimensions: [{key: 'audience', values: ['vip']}],
        representativeVariantId: '_.variants.solo',
      },
    ])
  })

  it('orders sets first (by name) then standalone variants', () => {
    const result = summarizeVariantDimensions([
      variant('solo', {audience: 'vip'}, {metadata: {title: 'Zulu standalone'}}),
      inSet('a', {market: 'us'}, 'set1', 'Beta set'),
      inSet('b', {market: 'uk'}, 'set2', 'Alpha set'),
    ])

    expect(result.map((group) => group.name)).toEqual(['Alpha set', 'Beta set', 'Zulu standalone'])
  })

  it('ignores blank keys and values', () => {
    const result = summarizeVariantDimensions([
      variant('a', {'  ': 'x', 'market': '   ', 'audience': 'loyal'}, {metadata: {title: 'T'}}),
    ])

    expect(result[0]!.dimensions).toEqual([{key: 'audience', values: ['loyal']}])
  })
})
