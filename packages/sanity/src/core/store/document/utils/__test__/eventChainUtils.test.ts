import {describe, expect, it} from 'vitest'

import {discardChainTo, toOrderedChains} from '../eventChainUtils'
import {mutationEvent} from './test-utils'

describe(toOrderedChains.name, () => {
  it('returns a list of chains', () => {
    const events = [
      // missing
      mutationEvent({previousRev: 'a', resultRev: 'b', mutations: []}),
      mutationEvent({previousRev: 'b', resultRev: 'c', mutations: []}),
      mutationEvent({previousRev: 'c', resultRev: 'd', mutations: []}),
      mutationEvent({previousRev: 'd', resultRev: 'e', mutations: []}),
      mutationEvent({previousRev: 'e', resultRev: 'f', mutations: []}),

      // mutationEvent({previousRev: 'g', resultRev: 'h', mutations: []}), // missing
      mutationEvent({previousRev: 'h', resultRev: 'i', mutations: []}),
      mutationEvent({previousRev: 'i', resultRev: 'j', mutations: []}),
      mutationEvent({previousRev: 'j', resultRev: 'k', mutations: []}),
      mutationEvent({previousRev: 'k', resultRev: 'l', mutations: []}),
      mutationEvent({previousRev: 'l', resultRev: 'm', mutations: []}),
    ]
    const [first, second] = toOrderedChains(events)

    expect(first.map((ev) => ev.resultRev)).toEqual(['b', 'c', 'd', 'e', 'f'])
    expect(second.map((ev) => ev.resultRev)).toEqual(['i', 'j', 'k', 'l', 'm'])
  })
})

describe(discardChainTo.name, () => {
  it('discards mutation events in the chain up to the provided revision', () => {
    const events = [
      mutationEvent({previousRev: 'a', resultRev: 'b', mutations: []}),
      mutationEvent({previousRev: 'b', resultRev: 'c', mutations: []}),
      mutationEvent({previousRev: 'c', resultRev: 'd', mutations: []}),
      mutationEvent({previousRev: 'd', resultRev: 'e', mutations: []}),
      mutationEvent({previousRev: 'e', resultRev: 'f', mutations: []}),
    ]
    const [discarded, applicable] = discardChainTo(events, 'd')
    // Note, it's still in the order received
    expect(discarded.map((ev) => ev.resultRev)).toEqual(['b', 'c', 'd'])
    expect(applicable.map((ev) => ev.resultRev)).toEqual(['e', 'f'])
  })
})
