import {describe, expect, it} from 'vitest'

import {type SystemVariant} from '../../types'
import {VARIANT_SET_METADATA_KEY} from '../variantSet'
import {
  type DimensionEdit,
  planVariantSetEdit,
  reconstructVariantSetDimensions,
} from '../variantSetEdit'

const setReference = {id: 'set-1', name: 'Regional launch'}

function child(id: string, conditions: Record<string, string>): SystemVariant {
  return {
    _id: id,
    _type: 'system.variant',
    conditions,
    priority: 0,
    metadata: {
      title: `Regional launch: ${Object.values(conditions).join(' / ')}`,
      description: [],
      [VARIANT_SET_METADATA_KEY]: setReference,
    },
  } as unknown as SystemVariant
}

// A 2x2 set: market (uk, us) x segment (loyal, new).
const children = [
  child('c1', {market: 'uk', segment: 'loyal'}),
  child('c2', {market: 'uk', segment: 'new'}),
  child('c3', {market: 'us', segment: 'loyal'}),
  child('c4', {market: 'us', segment: 'new'}),
]

const unchangedMarket: DimensionEdit = {
  key: 'market',
  values: [
    {originalValue: 'uk', value: 'uk'},
    {originalValue: 'us', value: 'us'},
  ],
}
const unchangedSegment: DimensionEdit = {
  key: 'segment',
  values: [
    {originalValue: 'loyal', value: 'loyal'},
    {originalValue: 'new', value: 'new'},
  ],
}

const plan = (edits: DimensionEdit[], documentCountById: Record<string, number> = {}) =>
  planVariantSetEdit({setReference, children, documentCountById, edits})

describe('reconstructVariantSetDimensions', () => {
  it('rebuilds ordered unique values per key from children', () => {
    expect(reconstructVariantSetDimensions(children)).toEqual([
      {key: 'market', values: ['uk', 'us']},
      {key: 'segment', values: ['loyal', 'new']},
    ])
  })
})

describe('planVariantSetEdit', () => {
  it('propagates a value rename by patching the matching definitions in place', () => {
    const result = plan([
      unchangedMarket,
      {
        key: 'segment',
        values: [
          {originalValue: 'loyal', value: 'loyal-users'},
          {originalValue: 'new', value: 'new'},
        ],
      },
    ])

    expect(result.creates).toHaveLength(0)
    expect(result.deletes).toHaveLength(0)
    expect(result.updates.map((u) => u._id).sort()).toEqual(['c1', 'c3'])
    const c1 = result.updates.find((u) => u._id === 'c1')!
    expect(c1.conditions).toEqual({market: 'uk', segment: 'loyal-users'})
    expect(c1.metadata?.title).toBe('Regional launch: uk / loyal-users')
  })

  it('deletes the definitions for a removed value when none have documents', () => {
    const result = plan([
      {key: 'market', values: [{originalValue: 'uk', value: 'uk'}]},
      unchangedSegment,
    ])

    expect(result.deletes.map((d) => d.id).sort()).toEqual(['c3', 'c4'])
    expect(result.blockedRemovals).toHaveLength(0)
  })

  it('blocks a value removal when an affected definition has documents', () => {
    const result = plan(
      [{key: 'market', values: [{originalValue: 'uk', value: 'uk'}]}, unchangedSegment],
      {c3: 2},
    )

    expect(result.deletes).toHaveLength(0)
    expect(result.blockedRemovals).toHaveLength(1)
    expect(result.blockedRemovals[0]).toMatchObject({key: 'market', value: 'us'})
    expect(result.blockedRemovals[0]!.withDocuments.map((d) => d.id)).toEqual(['c3'])
  })

  it('generates deduped new definitions for an added value', () => {
    const result = plan([
      {
        key: 'market',
        values: [
          {originalValue: 'uk', value: 'uk'},
          {originalValue: 'us', value: 'us'},
          {originalValue: null, value: 'de'},
        ],
      },
      unchangedSegment,
    ])

    expect(result.creates.map((c) => c.conditions)).toEqual([
      {market: 'de', segment: 'loyal'},
      {market: 'de', segment: 'new'},
    ])
    expect(result.updates).toHaveLength(0)
    expect(result.deletes).toHaveLength(0)
  })

  it('does not recreate a combination that already exists (dedupe)', () => {
    const result = plan([
      {
        key: 'market',
        values: [
          {originalValue: 'uk', value: 'uk'},
          {originalValue: 'us', value: 'us'},
          {originalValue: null, value: 'uk'},
        ],
      },
      unchangedSegment,
    ])

    expect(result.creates).toHaveLength(0)
  })

  it('skips a rename whose target already exists and reports the conflict', () => {
    const result = plan([
      {
        key: 'market',
        values: [
          {originalValue: 'uk', value: 'uk'},
          {originalValue: 'us', value: 'uk'},
        ],
      },
      unchangedSegment,
    ])

    expect(result.renameConflicts).toEqual([{key: 'market', from: 'us', to: 'uk'}])
    expect(result.updates).toHaveLength(0)
  })
})
