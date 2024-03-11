import {type Call, type Numbers, type Tuples} from 'hotscript'

import {type Operation} from '../../../mutations/operations/types'
import {type NodePatch} from '../../../mutations/types'
import {type KeyedPathElement, type Path} from '../../../path'
import {
  type AnyArray,
  type EmptyArray,
  type Format,
} from '../../../utils/typeUtils'
import {type ApplyOp} from './applyOp'

export type PickOrUndef<T, Head> = Head extends keyof T ? T[Head] : undefined

export type ApplyInObject<
  Head,
  Tail extends AnyArray,
  Op extends Operation,
  Node,
> = Head extends keyof Node
  ? {
      [K in keyof Node]: K extends Head
        ? ApplyAtPath<Tail, Op, PickOrUndef<Node, Head>>
        : Node[K]
    }
  : Tail extends EmptyArray
    ? Head extends string
      ? Format<Node & {[K in Head]: ApplyOp<Op, undefined>}>
      : never
    : Node

export type ApplyAtIndex<
  Index extends number,
  Tail extends AnyArray,
  Op extends Operation,
  Arr extends AnyArray,
> = [
  ...Call<Tuples.Take<Index, Arr>>,
  ApplyAtPath<Tail, Op, Arr[Index]>,
  ...Call<Tuples.Drop<Call<Numbers.Add<Index, 1>>, Arr>>,
]

export type ApplyAtSelector<
  Selector extends KeyedPathElement,
  Tail extends AnyArray,
  Op extends Operation,
  Arr extends AnyArray,
> =
  FirstIndexOf<0, Selector, Arr> extends infer Index
    ? Index extends number
      ? ApplyAtIndex<Index, Tail, Op, Arr>
      : Arr
    : Arr

export type FirstIndexOf<
  StartIndex extends number,
  Selector extends KeyedPathElement,
  Arr extends AnyArray,
> = Arr extends [infer Head, ...infer Tail]
  ? Head extends Selector
    ? StartIndex
    : FirstIndexOf<Call<Numbers.Add<StartIndex>, 1>, Selector, Tail>
  : null

export type ApplyInArray<
  ItemSelector,
  Tail extends AnyArray,
  Op extends Operation,
  Arr extends AnyArray,
> = ItemSelector extends number
  ? ApplyAtIndex<ItemSelector, Tail, Op, Arr>
  : ItemSelector extends KeyedPathElement
    ? ApplyAtSelector<ItemSelector, Tail, Op, Arr>
    : never

export type ApplyAtPath<
  Pth extends Path,
  Op extends Operation,
  Node,
> = Pth extends EmptyArray
  ? // destination reached
    ApplyOp<Op, Node>
  : Pth extends [infer Head, ...infer Tail]
    ? Node extends AnyArray
      ? ApplyInArray<Head, Tail, Op, Node>
      : Node extends {[K in string]: unknown}
        ? ApplyInObject<Head, Tail, Op, Node>
        : never
    : never

export type ApplyPatches<Patches, Node> = Patches extends [
  infer HeadPatch,
  ...infer TailPatch,
]
  ? HeadPatch extends NodePatch
    ? TailPatch extends []
      ? ApplyNodePatch<HeadPatch, Node>
      : TailPatch extends NodePatch[]
        ? ApplyPatches<TailPatch, ApplyNodePatch<HeadPatch, Node>>
        : Node
    : Node
  : Node

export type ApplyNodePatch<Patch extends NodePatch, Node> =
  Patch extends NodePatch<infer P, infer Op>
    ? ApplyAtPath<P, Op, Node>
    : ApplyAtPath<Patch['path'], Patch['op'], Node>
