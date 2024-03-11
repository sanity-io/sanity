import {type MutationGroup} from '../types'

/**
 * Merges adjacent non-transactional mutation groups, interleaving transactional mutations as-is
 * @param mutationGroups
 */
export function mergeMutationGroups(
  mutationGroups: MutationGroup[],
): MutationGroup[] {
  return chunkWhile(mutationGroups, group => !group.transaction).flatMap(
    chunk => ({
      ...chunk[0],
      mutations: chunk.flatMap(c => c.mutations),
    }),
  )
}

/**
 * Groups subsequent mutations into transactions, leaves transactions as-is
 * @param arr
 * @param predicate
 */
export function chunkWhile<T>(
  arr: T[],
  predicate: (item: T) => boolean,
): T[][] {
  const res: T[][] = []
  let currentChunk: T[] = []
  arr.forEach(item => {
    if (predicate(item)) {
      currentChunk.push(item)
    } else {
      if (currentChunk.length > 0) {
        res.push(currentChunk)
      }
      currentChunk = []
      res.push([item])
    }
  })
  if (currentChunk.length > 0) {
    res.push(currentChunk)
  }
  return res
}
