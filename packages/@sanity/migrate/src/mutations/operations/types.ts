import {type KeyedSegment} from '@sanity/types'

import {type AnyArray} from '../typeUtils'

/**
 * Represents an indexed segment in a document.
 */
type IndexedSegment = number

export type {IndexedSegment, KeyedSegment}

/**
 * Represents a set-operation that can be applied to any value
 */
export type SetOp<T> = {
  type: 'set'
  value: T
}

/**
 * Represents an unset operation that can be applied to any value
 */
export type UnsetOp = {
  type: 'unset'
}

/**
 * Represents a setIfMissing operation that can be applied to any value
 */
export type SetIfMissingOp<T> = {
  type: 'setIfMissing'
  value: T
}

/**
 * Represents a increment-operation that can be applied to a number
 */
export type IncOp<Amount extends number> = {
  type: 'inc'
  amount: Amount
}

/**
 * Represents a decrement-operation that can be applied to a number
 */
export type DecOp<Amount extends number> = {
  type: 'dec'
  amount: Amount
}

/**
 * Represents a relative position in a document.
 */
export type RelativePosition = 'before' | 'after'

/**
 * Represents an insert-operation that can be applied to an array
 */
export type InsertOp<
  Items extends AnyArray,
  Pos extends RelativePosition,
  ReferenceItem extends IndexedSegment | KeyedSegment,
> = {
  type: 'insert'
  referenceItem: ReferenceItem
  position: Pos
  items: Items
}

/**
 * Represents a truncate-operation that can be applied to an array
 */
export type TruncateOp = {
  type: 'truncate'
  startIndex: number
  endIndex?: number
}

/**
 * Represents a replace-operation that can be applied to an array
 */
export type ReplaceOp<
  Items extends AnyArray,
  ReferenceItem extends IndexedSegment | KeyedSegment,
> = {
  type: 'replace'
  referenceItem: ReferenceItem
  items: Items
}

/**
 * Represents a diffMatchPatch operation that can be applied to a string
 */
export type DiffMatchPatchOp = {
  type: 'diffMatchPatch'
  value: string
}

/**
 * Represents an operation that can be applied to values of all types
 */
export type Operation = PrimitiveOp | ArrayOp

/**
 * Represents an operation that can be applied to values of all types
 */
export type AnyOp = SetOp<unknown> | SetIfMissingOp<unknown> | UnsetOp

/**
 * Represents an operation that can be applied to a number
 */
export type NumberOp = IncOp<number> | DecOp<number>

/**
 * Represents an operation that can be applied to a string
 */
export type StringOp = DiffMatchPatchOp

/**
 * Represents ann operation that can be applied to an array
 */
export type ArrayOp =
  | InsertOp<AnyArray, RelativePosition, IndexedSegment | KeyedSegment>
  | ReplaceOp<AnyArray, IndexedSegment | KeyedSegment>
  | TruncateOp

/**
 * Represents an operation that can be applied to any primitive value
 */
export type PrimitiveOp = AnyOp | StringOp | NumberOp
