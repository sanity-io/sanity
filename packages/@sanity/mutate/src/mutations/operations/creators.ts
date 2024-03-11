import {arrify} from '../../utils/arrify'
import {
  type AnyArray,
  type ArrayElement,
  type NormalizeReadOnlyArray,
} from '../../utils/typeUtils'
import {
  type AssignOp,
  type DecOp,
  type DiffMatchPatchOp,
  type IncOp,
  type Index,
  type InsertOp,
  type KeyedPathElement,
  type RelativePosition,
  type ReplaceOp,
  type SetIfMissingOp,
  type SetOp,
  type TruncateOp,
  type UnassignOp,
  type UnsetOp,
  type UpsertOp,
} from './types'

export const set = <const T>(value: T): SetOp<T> => ({type: 'set', value})

export const assign = <const T extends {[K in string]: unknown}>(
  value: T,
): AssignOp<T> => ({
  type: 'assign',
  value,
})

export const unassign = <const K extends readonly string[]>(
  keys: K,
): UnassignOp<K> => ({
  type: 'unassign',
  keys,
})

export const setIfMissing = <const T>(value: T): SetIfMissingOp<T> => ({
  type: 'setIfMissing',
  value,
})

export const unset = (): UnsetOp => ({type: 'unset'})

export const inc = <const N extends number = 1>(
  amount: N = 1 as N,
): IncOp<N> => ({
  type: 'inc',
  amount,
})

export const dec = <const N extends number = 1>(
  amount: N = 1 as N,
): DecOp<N> => ({
  type: 'dec',
  amount,
})

export const diffMatchPatch = (value: string): DiffMatchPatchOp => ({
  type: 'diffMatchPatch',
  value,
})

export function insert<
  const Items extends AnyArray<unknown>,
  const Pos extends RelativePosition,
  const ReferenceItem extends Index | KeyedPathElement,
>(
  items: Items | ArrayElement<Items>,
  position: Pos,
  indexOrReferenceItem: ReferenceItem,
): InsertOp<NormalizeReadOnlyArray<Items>, Pos, ReferenceItem> {
  return {
    type: 'insert',
    referenceItem: indexOrReferenceItem,
    position,
    items: arrify(items) as any,
  }
}

export function append<const Items extends AnyArray<unknown>>(
  items: Items | ArrayElement<Items>,
) {
  return insert(items, 'after', -1)
}

export function prepend<const Items extends AnyArray<unknown>>(
  items: Items | ArrayElement<Items>,
) {
  return insert(items, 'before', 0)
}

export function insertBefore<
  const Items extends AnyArray<unknown>,
  const ReferenceItem extends Index | KeyedPathElement,
>(items: Items | ArrayElement<Items>, indexOrReferenceItem: ReferenceItem) {
  return insert(items, 'before', indexOrReferenceItem)
}

export const insertAfter = <
  const Items extends AnyArray<unknown>,
  const ReferenceItem extends Index | KeyedPathElement,
>(
  items: Items | ArrayElement<Items>,
  indexOrReferenceItem: ReferenceItem,
) => {
  return insert(items, 'after', indexOrReferenceItem)
}

export function truncate(startIndex: number, endIndex?: number): TruncateOp {
  return {
    type: 'truncate',
    startIndex,
    endIndex,
  }
}

/*
  Use this when you know the ref Items already exists
 */
export function replace<
  Items extends any[],
  ReferenceItem extends Index | KeyedPathElement,
>(
  items: Items | ArrayElement<Items>,
  referenceItem: ReferenceItem,
): ReplaceOp<Items, ReferenceItem> {
  return {
    type: 'replace',
    referenceItem,
    items: arrify(items) as Items,
  }
}

/*
use this when the reference Items may or may not exist
 */
export function upsert<
  const Items extends AnyArray<unknown>,
  const Pos extends RelativePosition,
  const ReferenceItem extends Index | KeyedPathElement,
>(
  items: Items | ArrayElement<Items>,
  position: Pos,
  referenceItem: ReferenceItem,
): UpsertOp<Items, Pos, ReferenceItem> {
  return {
    type: 'upsert',
    items: arrify(items) as Items,
    referenceItem,
    position,
  }
}
