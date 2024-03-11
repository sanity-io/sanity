import {type Index, type KeyedPathElement} from '../../path'
import {type AnyArray} from '../../utils/typeUtils'

export {Index, KeyedPathElement}

export type SetOp<T> = {
  type: 'set'
  value: T
}

export type UnsetOp = {
  type: 'unset'
}

export type SetIfMissingOp<T> = {
  type: 'setIfMissing'
  value: T
}

export type IncOp<Amount extends number> = {
  type: 'inc'
  amount: Amount
}

export type DecOp<Amount extends number> = {
  type: 'dec'
  amount: Amount
}

export type RelativePosition = 'before' | 'after'

export type InsertOp<
  Items extends AnyArray,
  Pos extends RelativePosition,
  ReferenceItem extends Index | KeyedPathElement,
> = {
  type: 'insert'
  referenceItem: ReferenceItem
  position: Pos
  items: Items
}

export type TruncateOp = {
  type: 'truncate'
  startIndex: number
  endIndex?: number
}
export type ReplaceOp<
  Items extends AnyArray,
  ReferenceItem extends Index | KeyedPathElement,
> = {
  type: 'replace'
  referenceItem: ReferenceItem
  items: Items
}
export type UpsertOp<
  Items extends AnyArray,
  Pos extends RelativePosition,
  ReferenceItem extends Index | KeyedPathElement,
> = {
  type: 'upsert'
  items: Items
  referenceItem: ReferenceItem
  position: Pos
}

export type AssignOp<T extends object = object> = {
  type: 'assign'
  value: T
}

export type UnassignOp<K extends readonly string[] = readonly string[]> = {
  type: 'unassign'
  keys: K
}

export type DiffMatchPatchOp = {
  type: 'diffMatchPatch'
  value: string
}

export type Operation = PrimitiveOp | ArrayOp | ObjectOp

export type AnyOp = SetOp<unknown> | SetIfMissingOp<unknown> | UnsetOp
export type NumberOp = IncOp<number> | DecOp<number>
export type StringOp = DiffMatchPatchOp
export type ObjectOp = AssignOp | UnassignOp
export type ArrayOp =
  | InsertOp<AnyArray, RelativePosition, Index | KeyedPathElement>
  | UpsertOp<AnyArray, RelativePosition, Index | KeyedPathElement>
  | ReplaceOp<AnyArray, Index | KeyedPathElement>
  | TruncateOp

export type PrimitiveOp = AnyOp | StringOp | NumberOp
