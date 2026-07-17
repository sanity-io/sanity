import {describe, expect, it} from 'vitest'

import {type EditableSystemVariant, type SystemVariant} from '../../types'
import {
  forkVariantFromSetIfConditionsChanged,
  getForkedFromSetReference,
  getVariantSetReference,
  VARIANT_SET_FORKED_FROM_METADATA_KEY,
  VARIANT_SET_METADATA_KEY,
} from '../variantSet'

const setReference = {id: 'set-1', name: 'Regional launch'}

function member(conditions: Record<string, string>): SystemVariant {
  return {
    _id: '_.variants.abc',
    _type: 'system.variant',
    _rev: 'r',
    _createdAt: '',
    _updatedAt: '',
    conditions,
    priority: 0,
    metadata: {title: 'x', description: [], [VARIANT_SET_METADATA_KEY]: setReference},
  } as unknown as SystemVariant
}

describe('getVariantSetReference / getForkedFromSetReference', () => {
  it('reads a valid membership reference', () => {
    expect(getVariantSetReference(member({market: 'uk'}))).toEqual(setReference)
  })

  it('returns undefined when there is no reference', () => {
    expect(getVariantSetReference({metadata: {title: 'x'}})).toBeUndefined()
    expect(getForkedFromSetReference({metadata: {title: 'x'}})).toBeUndefined()
  })

  it('returns undefined for a malformed reference', () => {
    expect(
      getVariantSetReference({metadata: {[VARIANT_SET_METADATA_KEY]: {id: 1}}}),
    ).toBeUndefined()
  })

  it('reads a fork-origin reference', () => {
    const forked = {metadata: {[VARIANT_SET_FORKED_FROM_METADATA_KEY]: setReference}}
    expect(getForkedFromSetReference(forked)).toEqual(setReference)
    expect(getVariantSetReference(forked)).toBeUndefined()
  })
})

describe('forkVariantFromSetIfConditionsChanged', () => {
  const edit = (conditions: Record<string, string>): EditableSystemVariant => ({
    _id: '_.variants.abc',
    _type: 'system.variant',
    conditions,
    priority: 0,
    metadata: {title: 'x', description: [], [VARIANT_SET_METADATA_KEY]: setReference},
  })

  it('forks a member when its conditions change', () => {
    const original = member({market: 'uk'})
    const result = forkVariantFromSetIfConditionsChanged(original, edit({market: 'gb'}))

    expect(getVariantSetReference(result)).toBeUndefined()
    expect(getForkedFromSetReference(result)).toEqual(setReference)
  })

  it('keeps membership when only non-condition fields change', () => {
    const original = member({market: 'uk'})
    const result = forkVariantFromSetIfConditionsChanged(original, edit({market: 'uk'}))

    expect(getVariantSetReference(result)).toEqual(setReference)
    expect(getForkedFromSetReference(result)).toBeUndefined()
  })

  it('leaves a non-member untouched', () => {
    const original = {
      conditions: {market: 'uk'},
      metadata: {title: 'x'},
    }
    const edited: EditableSystemVariant = {
      _id: '_.variants.abc',
      _type: 'system.variant',
      conditions: {market: 'gb'},
      priority: 0,
      metadata: {title: 'x'},
    }

    expect(forkVariantFromSetIfConditionsChanged(original, edited)).toBe(edited)
  })
})
