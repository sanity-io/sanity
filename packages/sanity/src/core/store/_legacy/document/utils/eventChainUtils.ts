import {type MutationEvent} from '../types'

export function discardChainTo(chain: MutationEvent[], revision: string | undefined) {
  const revisionIndex = chain.findIndex((event) => event.resultRev === revision)

  return split(chain, revisionIndex + 1)
}

function split<T>(array: T[], index: number) {
  if (index < 0) {
    return [[], array]
  }
  return [array.slice(0, index), array.slice(index)]
}

export function toOrderedChains<T extends {previousRev: string; resultRev: string}>(events: T[]) {
  const parents: Record<string, T | undefined> = {}

  events.forEach((event) => {
    parents[event.resultRev] = events.find((other) => other.resultRev === event.previousRev)
  })

  // get entries without a parent (if there's more than one, we have a problem)
  const orphans = Object.entries(parents).filter(([, parent]) => {
    return !parent
  })!

  return orphans.map((orphan) => {
    const [headRev] = orphan

    let current = events.find((event) => event.resultRev === headRev)

    const sortedList: T[] = []
    while (current) {
      sortedList.push(current)
      // eslint-disable-next-line no-loop-func
      current = events.find((event) => event.previousRev === current?.resultRev)
    }
    return sortedList
  })
}
