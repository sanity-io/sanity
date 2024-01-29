import arrify from 'arrify'
import {AnyArray, ArrayElement, NormalizeReadOnlyArray} from '../typeUtils'
import type {
  DecOp,
  DiffMatchPatchOp,
  IncOp,
  IndexedSegment,
  InsertOp,
  KeyedSegment,
  RelativePosition,
  ReplaceOp,
  SetIfMissingOp,
  SetOp,
  TruncateOp,
  UnsetOp,
} from './types'

/**
 * Creates a `set` operation with the provided value.
 * @param value - The value to set.
 * @returns A `set` operation.
 * {@link https://www.sanity.io/docs/http-patches#6TPENSW3}
 * @beta
 */
export const set = <const T>(value: T): SetOp<T> => ({type: 'set', value})

/**
 * Creates a `setIfMissing` operation with the provided value.
 * @param value - The value to set if missing.
 * @returns A `setIfMissing` operation.
 * {@link https://www.sanity.io/docs/http-patches#A80781bT}
 * @beta
 */
export const setIfMissing = <const T>(value: T): SetIfMissingOp<T> => ({
  type: 'setIfMissing',
  value,
})

/**
 * Creates an `unset` operation.
 * @returns An `unset` operation.
 * {@link https://www.sanity.io/docs/http-patches#xRtBjp8o}
 * @beta
 */
export const unset = (): UnsetOp => ({type: 'unset'})

/**
 * Creates an `inc` (increment) operation with the provided amount.
 * @param amount - The amount to increment by.
 * @returns An `inc` operation.
 * {@link https://www.sanity.io/docs/http-patches#vIT8WWQo}
 * @beta
 */
export const inc = <const N extends number = 1>(amount: N = 1 as N): IncOp<N> => ({
  type: 'inc',
  amount,
})

/**
 * Creates a `dec` (decrement) operation with the provided amount.
 * @param amount - The amount to decrement by.
 * @returns A `dec` operation.
 * {@link https://www.sanity.io/docs/http-patches#vIT8WWQo}
 * @beta
 */
export const dec = <const N extends number = 1>(amount: N = 1 as N): DecOp<N> => ({
  type: 'dec',
  amount,
})

/**
 * Creates a `diffMatchPatch` operation with the provided value.
 * @param value - The value for the diff match patch operation.
 * @returns A `diffMatchPatch` operation.
 * {@link https://www.sanity.io/docs/http-patches#aTbJhlAJ}
 * @beta
 */
export const diffMatchPatch = (value: string): DiffMatchPatchOp => ({
  type: 'diffMatchPatch',
  value,
})

/**
 * Creates an `insert` operation with the provided items, position, and reference item.
 * @param items - The items to insert.
 * @param position - The position to insert at.
 * @param indexOrReferenceItem - The index or reference item to insert before or after.
 * @returns An `insert` operation.
 * {@link https://www.sanity.io/docs/http-patches#febxf6Fk}
 * @beta
 */
export function insert<
  const Items extends AnyArray<unknown>,
  const Pos extends RelativePosition,
  const ReferenceItem extends IndexedSegment | KeyedSegment,
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

/**
 * Creates an `insert` operation that appends the provided items.
 * @param items - The items to append.
 * @returns An `insert` operation at the end of the array.
 * {@link https://www.sanity.io/docs/http-patches#Cw4vhD88}
 * @beta
 */
export function append<const Items extends AnyArray<unknown>>(items: Items | ArrayElement<Items>) {
  return insert(items, 'after', -1)
}

/**
 * Creates an `insert` operation that prepends the provided items.
 * @param items - The items to prepend.
 * @returns An `insert` operation at the beginning of the array.
 * {@link https://www.sanity.io/docs/http-patches#refAUsf0}
 * @beta
 */
export function prepend<const Items extends AnyArray<unknown>>(items: Items | ArrayElement<Items>) {
  return insert(items, 'before', 0)
}

/**
 * Creates an `insert` operation that inserts the provided items before the provided index or reference item.
 * @param items - The items to insert.
 * @param indexOrReferenceItem - The index or reference item to insert before.
 * @returns An `insert` operation before the provided index or reference item.
 * {@link https://www.sanity.io/docs/http-patches#0SQmPlb6}
 */
export function insertBefore<
  const Items extends AnyArray<unknown>,
  const ReferenceItem extends IndexedSegment | KeyedSegment,
>(items: Items | ArrayElement<Items>, indexOrReferenceItem: ReferenceItem) {
  return insert(items, 'before', indexOrReferenceItem)
}

/**
 * Creates an `insert` operation that inserts the provided items after the provided index or reference item.
 * @param items - The items to insert.
 * @param indexOrReferenceItem - The index or reference item to insert after.
 * @returns An `insert` operation after the provided index or reference item.
 * {@link https://www.sanity.io/docs/http-patches#0SQmPlb6}
 * @beta
 */
export const insertAfter = <
  const Items extends AnyArray<unknown>,
  const ReferenceItem extends IndexedSegment | KeyedSegment,
>(
  items: Items | ArrayElement<Items>,
  indexOrReferenceItem: ReferenceItem,
) => {
  return insert(items, 'after', indexOrReferenceItem)
}

/**
 * Creates a `truncate` operation that will remove all items after `startIndex` until the end of the array or the provided `endIndex`.
 * @param startIndex - The start index for the truncate operation.
 * @param endIndex - The end index for the truncate operation.
 * @returns A `truncate` operation.
 * @remarks - This will be converted to an `unset` patch when submitted to the API
 * {@link https://www.sanity.io/docs/http-patches#xRtBjp8o}
 * @beta
 */
export function truncate(startIndex: number, endIndex?: number): TruncateOp {
  return {
    type: 'truncate',
    startIndex,
    endIndex,
  }
}

/**
 * Creates a `replace` operation with the provided items and reference item.
 * @param items - The items to replace.
 * @param referenceItem - The reference item to replace.
 * @returns A ReplaceOp operation.
 * @remarks This will be converted to an `insert`/`replace` patch when submitted to the API
 * {@link https://www.sanity.io/docs/http-patches#GnVSwcPa}
 * @beta
 */
export function replace<Items extends any[], ReferenceItem extends IndexedSegment | KeyedSegment>(
  items: Items | ArrayElement<Items>,
  referenceItem: ReferenceItem,
): ReplaceOp<Items, ReferenceItem> {
  return {
    type: 'replace',
    referenceItem,
    items: arrify(items) as Items,
  }
}
