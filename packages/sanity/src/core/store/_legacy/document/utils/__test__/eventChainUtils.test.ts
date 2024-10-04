import {expect, test} from '@jest/globals'

import {discardChainTo, linkedSort, partitionChainableAndOrphaned} from '../eventChainUtils'
import {mutationEvent} from './test-utils'

test('partitionChainableAndOrphaned', () => {
  const events = [
    mutationEvent({previousRev: 'a', resultRev: 'b', mutations: []}),
    mutationEvent({previousRev: 'b', resultRev: 'c', mutations: []}),
    mutationEvent({previousRev: 'c', resultRev: 'd', mutations: []}),
    mutationEvent({previousRev: 'd', resultRev: 'e', mutations: []}),
    mutationEvent({previousRev: 'e', resultRev: 'f', mutations: []}),
  ]
  const [chainable, orphaned] = partitionChainableAndOrphaned(events)
  // Note, it's still in the order received
  expect(chainable.map((ev) => ev.resultRev)).toEqual(['c', 'd', 'e', 'f'])
  expect(orphaned.map((ev) => ev.resultRev)).toEqual(['b'])
})

test('partitionChainableAndOrphaned of out of order', () => {
  const events = [
    mutationEvent({previousRev: 'e', resultRev: 'f', mutations: []}),
    mutationEvent({previousRev: 'b', resultRev: 'c', mutations: []}),
    mutationEvent({previousRev: 'x', resultRev: 'y', mutations: []}), // <-- orphaned
    mutationEvent({previousRev: 'c', resultRev: 'd', mutations: []}),
    mutationEvent({previousRev: 'a', resultRev: 'b', mutations: []}), // <-- orphaned
    mutationEvent({previousRev: 'd', resultRev: 'e', mutations: []}),
  ]
  const [chainable, orphaned] = partitionChainableAndOrphaned(events)
  // Note, it's still in the order received
  expect(chainable.map((ev) => ev.resultRev)).toEqual(['f', 'c', 'd', 'e'])
  expect(orphaned.map((ev) => ev.resultRev)).toEqual(['y', 'b'])
})

test('linkedSort', () => {
  const events = [
    mutationEvent({previousRev: 'a', resultRev: 'b', mutations: []}),
    mutationEvent({previousRev: 'b', resultRev: 'c', mutations: []}),
    mutationEvent({previousRev: 'c', resultRev: 'd', mutations: []}),
    mutationEvent({previousRev: 'd', resultRev: 'e', mutations: []}),
    mutationEvent({previousRev: 'e', resultRev: 'f', mutations: []}),
  ]
  const sorted = linkedSort(events)
  // Note, it's still in the order received
  expect(sorted.map((ev) => ev.resultRev)).toEqual(['b', 'c', 'd', 'e', 'f'])
})

test('discardChainTo', () => {
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
