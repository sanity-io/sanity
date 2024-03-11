import {type Call, type Numbers, type Tuples} from 'hotscript'

import {
  type AssignOp,
  type DecOp,
  type DiffMatchPatchOp,
  type IncOp,
  type InsertOp,
  type KeyedPathElement,
  type Operation,
  type ReplaceOp,
  type SetIfMissingOp,
  type SetOp,
  type UnassignOp,
  type UnsetOp,
} from '../../../mutations/operations/types'
import {
  type AnyArray,
  type ArrayElement,
  type ArrayLength,
  type NormalizeReadOnlyArray,
} from '../../../utils/typeUtils'

export type Between<
  Num extends number,
  Min extends number,
  Max extends number,
> =
  Call<Numbers.GreaterThanOrEqual<Num, Min>> extends true
    ? Call<Numbers.LessThanOrEqual<Num, Max>> extends true
      ? true
      : false
    : false

export type LastIndexOnEmptyArray<Index, Length> = Length extends 0
  ? Index extends -1
    ? true
    : false
  : false

export type NormalizeIndex<Index extends number, Length extends number> =
  LastIndexOnEmptyArray<Index, Length> extends true
    ? 0
    : Call<Numbers.LessThan<Index, 0>> extends true
      ? Call<Numbers.Add, Length, Index>
      : Index

export type AdjustIndex<
  Pos extends 'before' | 'after',
  Index extends number,
> = Pos extends 'before' ? Index : Call<Numbers.Add, Index, 1>

export type SplitAtPos<
  Current extends unknown[],
  NormalizedIndex extends number,
  Pos extends 'before' | 'after',
> = Call<Tuples.SplitAt<AdjustIndex<Pos, NormalizedIndex>, Current>>

export type _InsertAtIndex<
  Current extends unknown[],
  Values extends unknown[],
  Pos extends 'before' | 'after',
  NormalizedIndex extends number,
> =
  Between<NormalizedIndex, 0, ArrayLength<Current>> extends true
    ? SplitAtPos<Current, NormalizedIndex, Pos> extends [infer Head, infer Tail]
      ? Head extends AnyArray
        ? Tail extends AnyArray
          ? [
              ...(Head extends never[] ? [] : Head),
              ...Values,
              ...(Tail extends never[] ? [] : Tail),
            ]
          : never
        : never
      : never
    : Current

export type InsertAtIndex<
  Current extends unknown[],
  Values extends unknown[],
  Pos extends 'before' | 'after',
  Index extends number,
> = _InsertAtIndex<
  Current,
  Values,
  Pos,
  NormalizeIndex<Index, ArrayLength<Current>>
>

export type ArrayInsert<
  Current extends unknown[],
  Items extends unknown[],
  Pos extends 'before' | 'after',
  Ref extends number | KeyedPathElement,
> = Current extends (infer E)[]
  ? number extends Ref
    ? (E | ArrayElement<Items>)[]
    : Ref extends number
      ? InsertAtIndex<Current, Items, Pos, Ref>
      : (E | ArrayElement<Items>)[]
  : Current

export type Assign<Current, Attrs> = {
  [K in keyof Attrs | keyof Current]: K extends keyof Attrs
    ? Attrs[K]
    : K extends keyof Current
      ? Current[K]
      : never
}

export type ApplyOp<O extends Operation, Current> = Current extends never
  ? never
  : O extends SetOp<infer Next>
    ? Next
    : O extends UnsetOp
      ? undefined
      : O extends IncOp<infer Amount>
        ? Current extends number
          ? number extends Current
            ? number
            : Call<Numbers.Add, Current, Amount>
          : Current
        : O extends DecOp<infer Amount>
          ? Current extends number
            ? number extends Current
              ? number
              : Call<Numbers.Sub, Current, Amount>
            : Current
          : O extends InsertOp<infer Items, infer Pos, infer Ref>
            ? Current extends AnyArray<unknown>
              ? ArrayInsert<
                  NormalizeReadOnlyArray<Current>,
                  NormalizeReadOnlyArray<Items>,
                  Pos,
                  Ref
                >
              : Current
            : O extends ReplaceOp<infer Items, infer Ref>
              ? Current extends any[]
                ? (ArrayElement<Items> | ArrayElement<Current>)[]
                : never
              : O extends AssignOp<infer U>
                ? Assign<Current, U>
                : O extends SetIfMissingOp<infer V>
                  ? Current extends undefined | null
                    ? V
                    : Current
                  : O extends UnassignOp<infer U>
                    ? {
                        [K in keyof Current as Exclude<
                          K,
                          ArrayElement<U>
                        >]: Current[K]
                      }
                    : O extends DiffMatchPatchOp
                      ? string
                      : never
