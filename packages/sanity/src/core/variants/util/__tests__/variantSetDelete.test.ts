import {describe, expect, it} from 'vitest'

import {type SystemVariant} from '../../types'
import {getVariantSetReference, VARIANT_SET_METADATA_KEY} from '../variantSet'
import {planVariantSetDeletion} from '../variantSetDelete'

const setReference = {id: 'set-1', name: 'Regional launch'}

function child(id: string, conditions: Record<string, string>, setId = 'set-1'): SystemVariant {
  return {
    _id: id,
    _type: 'system.variant',
    conditions,
    priority: 0,
    metadata: {
      title: id,
      [VARIANT_SET_METADATA_KEY]: {id: setId, name: 'Regional launch'},
    },
  } as unknown as SystemVariant
}

describe('planVariantSetDeletion', () => {
  const children = [
    child('c1', {market: 'uk'}),
    child('c2', {market: 'us'}),
    child('c3', {market: 'de'}),
  ]

  it('deletes every member when none has documents', () => {
    const plan = planVariantSetDeletion({setReference, children, documentCountById: {}})

    expect(plan.deleteIds).toEqual(['c1', 'c2', 'c3'])
    expect(plan.detaches).toEqual([])
    expect(plan.retainedCount).toBe(0)
  })

  it('retains and detaches members that still have documents', () => {
    const plan = planVariantSetDeletion({setReference, children, documentCountById: {c2: 3}})

    expect(plan.deleteIds).toEqual(['c1', 'c3'])
    expect(plan.retainedCount).toBe(1)
    expect(plan.detaches).toHaveLength(1)
    expect(plan.detaches[0]!._id).toBe('c2')
    // A detached member no longer references the (now deleted) set, so it becomes standalone.
    expect(getVariantSetReference(plan.detaches[0]!)).toBeUndefined()
  })

  it('ignores variants that belong to a different set', () => {
    const mixed = [...children, child('other', {market: 'fr'}, 'set-2')]
    const plan = planVariantSetDeletion({setReference, children: mixed, documentCountById: {}})

    expect(plan.deleteIds).toEqual(['c1', 'c2', 'c3'])
    expect(plan.deleteIds).not.toContain('other')
  })
})
