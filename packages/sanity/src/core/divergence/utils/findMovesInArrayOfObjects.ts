import {lcs_dp as lcsDp} from '@algorithm.ts/lcs'
import {type KeyedObject} from '@sanity/types'
import {intersection} from 'lodash-es'
import {EMPTY, filter, from, map, type Observable, of, shareReplay, switchMap, toArray} from 'rxjs'

import {
  createMultiKeyWeakMap,
  type MultiKeyWeakMap,
} from '../../store/_legacy/createMultiKeyWeakMap'

let cache: MultiKeyWeakMap | undefined

type MovesByKey = Record<string, number>

/**
 * Identify objects that are present at a different postition in array B than in array A, preserving
 * the longest common subsequence shared by array A and B.
 *
 * For example, given arrays with the following keys:
 *   A: a, b, c, d
 *   B: b, c, d, a
 *
 * The only moved object is a, which has a position delta of 3.
 * The longest common subsequence is b, c, d. None of these objects have moved.
 */
export function findMovesInArrayOfObjects(
  a: KeyedObject[] | undefined,
  b: KeyedObject[] | undefined,
): Observable<MovesByKey> {
  // If either arrays are nonexistent, there cannot be moved nodes.
  if (typeof a === 'undefined' || typeof b === 'undefined') {
    return EMPTY
  }

  cache ??= createMultiKeyWeakMap()
  const cached = cache.get<Observable<MovesByKey>>([a, b])

  if (typeof cached !== 'undefined') {
    return cached
  }

  const {intersectingKeys, aIntersectingKeys, bIntersectingKeys} = findIntersectingKeys(a, b)

  const readMoves = of([aIntersectingKeys, bIntersectingKeys]).pipe(
    map(([aIntersecting, bIntersecting]) =>
      lcsDp(
        aIntersecting.length,
        bIntersecting.length,
        (x, y) => aIntersecting[x] === bIntersecting[y],
      ),
    ),
    map((lcs) => lcs.map(([aIndex]) => aIntersectingKeys[aIndex])),
    switchMap((lcsKeys) => {
      if (intersectingKeys.size < 3) {
        return from(lcsKeys)
      }
      if (lcsKeys.length === 1) {
        return from(intersectingKeys)
      }
      return from(intersectingKeys).pipe(filter((_key) => !lcsKeys.includes(_key)))
    }),
    map((_key) => [_key, bIntersectingKeys.indexOf(_key) - aIntersectingKeys.indexOf(_key)]),
    filter(([, positionDelta]) => positionDelta !== 0),
    toArray(),
    map(Object.fromEntries),
    shareReplay(1),
  )

  cache.set([a, b], readMoves)
  return readMoves
}

type FindIntersectingKeys = (
  a: KeyedObject[],
  b: KeyedObject[],
) => {
  intersectingKeys: Set<string>
  aIntersectingKeys: string[]
  bIntersectingKeys: string[]
}

const findIntersectingKeys: FindIntersectingKeys = (a, b) => {
  if ('intersection' in Set.prototype) {
    return findIntersectingKeysUsingSet(a, b)
  }

  return findIntersectingKeysUsingArray(a, b)
}

const findIntersectingKeysUsingSet: FindIntersectingKeys = (a, b) => {
  const aKeys = new Set(a.map(({_key}) => _key))
  const bKeys = new Set(b.map(({_key}) => _key))

  const intersectingKeys = aKeys.intersection(bKeys)

  const [aIntersectingKeys, bIntersectingKeys] = [a, b].map((subject) =>
    subject.filter(({_key}) => intersectingKeys.has(_key)).map(({_key}) => _key),
  )

  return {
    intersectingKeys,
    aIntersectingKeys,
    bIntersectingKeys,
  }
}

const findIntersectingKeysUsingArray: FindIntersectingKeys = (a, b) => {
  const aKeys = a.map(({_key}) => _key)
  const bKeys = b.map(({_key}) => _key)

  const intersectingKeys = intersection(aKeys, bKeys)

  const [aIntersectingKeys, bIntersectingKeys] = [a, b].map((subject) =>
    subject.filter(({_key}) => intersectingKeys.includes(_key)).map(({_key}) => _key),
  )

  return {
    intersectingKeys: new Set(intersectingKeys),
    aIntersectingKeys,
    bIntersectingKeys,
  }
}
