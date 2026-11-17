import {describe, expect, it} from 'vitest'

import {type MutationEvent} from '../../types'
import {discardChainTo, toOrderedChains} from '../eventChainUtils'
import {creationEvent, mutationEvent} from './test-utils'

function resultRevisions(chain: MutationEvent[]) {
  return chain.map((event) => event.resultRev)
}

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

  it('returns no chains for no events', () => {
    expect(toOrderedChains([])).toEqual([])
  })

  it('puts events that arrived out of order in the order of their revisions', () => {
    const chains = toOrderedChains([
      mutationEvent({previousRev: 'c', resultRev: 'd'}),
      mutationEvent({previousRev: 'a', resultRev: 'b'}),
      mutationEvent({previousRev: 'd', resultRev: 'e'}),
      mutationEvent({previousRev: 'b', resultRev: 'c'}),
    ])

    expect(chains.map(resultRevisions)).toEqual([['b', 'c', 'd', 'e']])
  })

  it('returns an event that continues from no other event as a chain of its own', () => {
    const chains = toOrderedChains([
      mutationEvent({previousRev: 'a', resultRev: 'b'}),
      mutationEvent({previousRev: 'x', resultRev: 'y'}),
    ])

    expect(chains.map(resultRevisions)).toEqual([['b'], ['y']])
  })

  it('keeps each chain in order when the events of several chains arrive mixed up', () => {
    const chains = toOrderedChains([
      mutationEvent({previousRev: 'j', resultRev: 'k'}),
      mutationEvent({previousRev: 'b', resultRev: 'c'}),
      mutationEvent({previousRev: 'i', resultRev: 'j'}),
      mutationEvent({previousRev: 'a', resultRev: 'b'}),
    ])

    expect(chains).toHaveLength(2)
    expect(chains.map(resultRevisions)).toEqual(
      expect.arrayContaining([
        ['b', 'c'],
        ['j', 'k'],
      ]),
    )
  })

  it('includes an event that was delivered twice only once', () => {
    const chains = toOrderedChains([
      mutationEvent({previousRev: 'a', resultRev: 'b'}),
      mutationEvent({previousRev: 'b', resultRev: 'c'}),
      mutationEvent({previousRev: 'a', resultRev: 'b'}),
    ])

    expect(chains.map(resultRevisions)).toEqual([['b', 'c']])
  })

  it('starts a chain with the event that creates the document', () => {
    const chains = toOrderedChains([
      mutationEvent({previousRev: 'a', resultRev: 'b'}),
      creationEvent({resultRev: 'a'}),
    ])

    expect(chains.map(resultRevisions)).toEqual([['a', 'b']])
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

  const chain = [
    mutationEvent({previousRev: 'a', resultRev: 'b'}),
    mutationEvent({previousRev: 'b', resultRev: 'c'}),
  ]

  it('discards nothing from a chain that continues from the revision', () => {
    const [discarded, applicable] = discardChainTo(chain, 'a')

    expect(discarded).toEqual([])
    expect(applicable).toEqual(chain)
  })

  it('discards the whole chain when it leads up to the revision', () => {
    const [discarded, applicable] = discardChainTo(chain, 'c')

    expect(discarded).toEqual(chain)
    expect(applicable).toEqual([])
  })

  it('discards nothing when no event in the chain leads up to the revision', () => {
    const [discarded, applicable] = discardChainTo(chain, 'x')

    expect(discarded).toEqual([])
    expect(applicable).toEqual(chain)
  })

  it('discards nothing when there is no revision, as for a document that does not exist', () => {
    const [discarded, applicable] = discardChainTo(chain, undefined)

    expect(discarded).toEqual([])
    expect(applicable).toEqual(chain)
  })
})
