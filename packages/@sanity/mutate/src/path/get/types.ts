import {type AnyArray} from '../../utils/typeUtils'
import {type KeyedPathElement} from '../types'

export type ByIndex<P extends number, T extends AnyArray> = T[P]

export type ElementType<T extends AnyArray> =
  T extends AnyArray<infer E> ? E : unknown

export type FindInArray<
  P extends KeyedPathElement | number,
  T extends AnyArray,
> = P extends KeyedPathElement
  ? FindBy<P, T>
  : P extends number
    ? ByIndex<P, T>
    : never

export type AnyEmptyArray = [] | readonly []

export type FindBy<P, T extends AnyArray> = T extends AnyEmptyArray
  ? undefined
  : T[0] extends P
    ? T[0]
    : T extends [any, ...infer Tail] | readonly [any, ...infer Tail]
      ? FindBy<P, Tail>
      : ElementType<T>
