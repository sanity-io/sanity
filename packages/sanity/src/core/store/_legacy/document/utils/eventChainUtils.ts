import {partition} from 'lodash'

import {type MutationEvent} from '../types'

export function discardChainTo(events: MutationEvent[], revision: string | undefined) {
  const sortedChain = linkedSort(events)
  const revisionIndex = sortedChain.findIndex((event) => event.resultRev === revision)

  // We
  return split(events, revisionIndex + 1)
}

function split<T>(array: T[], index: number) {
  if (index < 0) {
    return [[], array]
  }
  return [array.slice(0, index), array.slice(index)]
}

export function linkedSort<T extends {previousRev: string; resultRev: string}>(events: T[]) {
  const parents: Record<string, T | undefined> = {}

  events.forEach((event) => {
    parents[event.resultRev] = events.find((other) => other.resultRev === event.previousRev)
  })

  // get the first entry without a parent
  const head = Object.entries(parents).find(([, parent]) => {
    return !parent
  })!

  const [headRev] = head

  let current = events.find((event) => event.resultRev === headRev)

  const sortedList: T[] = []
  while (current) {
    sortedList.push(current)
    current = events.find((event) => event.previousRev === current?.resultRev)
  }
  return sortedList
}

export function partitionChainableAndOrphaned(
  events: MutationEvent[],
): [chainable: MutationEvent[], orphaned: MutationEvent[]] {
  return partition(events, (event) => {
    return events.some((other) => event.previousRev === other.resultRev)
  })
}
