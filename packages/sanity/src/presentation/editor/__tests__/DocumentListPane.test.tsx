import {describe, expect, it} from 'vitest'

import {deriveOrderedIds} from '../DocumentListPane'

function refsFor(ids: string[]): {_id: string; _type: string}[] {
  return ids.map((id) => ({_id: id, _type: 'page'}))
}

describe('deriveOrderedIds', () => {
  it('falls back to refs-only order when there is no visual order', () => {
    const orderedIds = deriveOrderedIds({
      visualOrderPublishedIds: [],
      refs: refsFor(['a', 'b', 'c']),
    })

    expect(orderedIds).toEqual(['a', 'b', 'c'])
  })

  it('seeds from visual order then appends membership-only ids from refs', () => {
    const orderedIds = deriveOrderedIds({
      visualOrderPublishedIds: ['c', 'a'],
      refs: refsFor(['a', 'b', 'c']),
    })

    expect(orderedIds).toEqual(['c', 'a', 'b'])
  })

  it('filters the main document id from both passes', () => {
    const orderedIds = deriveOrderedIds({
      visualOrderPublishedIds: ['c', 'a'],
      refs: refsFor(['a', 'b', 'c']),
      mainDocumentId: 'c',
    })

    expect(orderedIds).toEqual(['a', 'b'])
  })

  it('does not duplicate a visually ordered id when refs carry its draft variant', () => {
    const orderedIds = deriveOrderedIds({
      visualOrderPublishedIds: ['c'],
      refs: refsFor(['drafts.c']),
    })

    expect(orderedIds).toEqual(['c'])
  })
})
