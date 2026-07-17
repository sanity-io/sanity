import {describe, expect, it} from 'vitest'

import {buildVariantSetDefinitions} from '../buildVariantSetDefinitions'
import {getVariantSetReference} from '../variantSet'

describe('buildVariantSetDefinitions', () => {
  const input = {
    name: 'Regional launch',
    dimensions: [
      {key: 'market', values: ['uk', 'us']},
      {key: 'segment', values: ['loyal', 'new']},
    ],
  }

  it('creates one definition per permutation', () => {
    const {definitions} = buildVariantSetDefinitions(input)

    expect(definitions).toHaveLength(4)
    expect(definitions.map((definition) => definition.conditions)).toEqual([
      {market: 'uk', segment: 'loyal'},
      {market: 'uk', segment: 'new'},
      {market: 'us', segment: 'loyal'},
      {market: 'us', segment: 'new'},
    ])
  })

  it('gives every definition a unique id and the system.variant type', () => {
    const {definitions} = buildVariantSetDefinitions(input)
    const ids = definitions.map((definition) => definition._id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(definitions.every((definition) => definition._type === 'system.variant')).toBe(true)
    expect(definitions.every((definition) => definition.priority === 0)).toBe(true)
  })

  it('auto-titles each definition with the set name and combination', () => {
    const {definitions} = buildVariantSetDefinitions(input)

    expect(definitions[0]?.metadata?.title).toBe('Regional launch: uk / loyal')
    expect(definitions[3]?.metadata?.title).toBe('Regional launch: us / new')
  })

  it('stamps a shared, readable back-reference on every definition', () => {
    const {setReference, definitions} = buildVariantSetDefinitions(input)

    expect(setReference.name).toBe('Regional launch')
    expect(setReference.id).toBeTruthy()

    for (const definition of definitions) {
      expect(getVariantSetReference(definition)).toEqual(setReference)
    }
  })

  it('trims the set name', () => {
    const {setReference} = buildVariantSetDefinitions({
      name: '  Regional launch  ',
      dimensions: [{key: 'market', values: ['uk']}],
    })

    expect(setReference.name).toBe('Regional launch')
  })
})
