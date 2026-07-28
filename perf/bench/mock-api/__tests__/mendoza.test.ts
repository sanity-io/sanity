import {applyPatch} from 'mendoza'
import {describe, expect, it} from 'vitest'

import {wholeValueEffects} from '../mendoza'

describe('wholeValueEffects', () => {
  it('applies to produce the after value regardless of before', () => {
    const before = {_id: 'a', _type: 'doc', title: 'old'}
    const after = {_id: 'a', _type: 'doc', title: 'new', extra: [1, 2, 3]}
    const effects = wholeValueEffects(before, after)
    expect(applyPatch(before, effects.apply)).toEqual(after)
  })

  it('reverts to produce the before value', () => {
    const before = {_id: 'a', _type: 'doc', title: 'old'}
    const after = {_id: 'a', _type: 'doc', title: 'new'}
    const effects = wholeValueEffects(before, after)
    expect(applyPatch(after, effects.revert)).toEqual(before)
  })

  it('handles appear (before is null)', () => {
    const after = {_id: 'a', _type: 'doc'}
    const effects = wholeValueEffects(null, after)
    expect(applyPatch(null, effects.apply)).toEqual(after)
    expect(applyPatch(after, effects.revert)).toBeNull()
  })

  it('handles disappear (after is null)', () => {
    const before = {_id: 'a', _type: 'doc'}
    const effects = wholeValueEffects(before, null)
    expect(applyPatch(before, effects.apply)).toBeNull()
    expect(applyPatch(null, effects.revert)).toEqual(before)
  })
})
