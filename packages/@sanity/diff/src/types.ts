export type DiffOptions = Record<string, never>

export type ValueType = 'array' | 'boolean' | 'null' | 'number' | 'object' | 'string' | 'undefined'

export type Input<T> =
  | NumberInput<T>
  | BooleanInput<T>
  | StringInput<T>
  | NullInput<T>
  | ObjectInput<T>
  | ArrayInput<T>

interface BaseInput<A> {
  annotation: A
}

export interface StringInput<A> extends BaseInput<A> {
  type: 'string'
  value: string
  sliceAnnotation(start: number, end: number): {text: string; annotation: A}[]
}

export interface NumberInput<A> extends BaseInput<A> {
  type: 'number'
  value: number
}

export interface BooleanInput<A> extends BaseInput<A> {
  type: 'boolean'
  value: boolean
}

export interface NullInput<A> extends BaseInput<A> {
  type: 'null'
  value: null
}

export interface ObjectInput<A> extends BaseInput<A> {
  type: 'object'
  value: Record<string, unknown>
  keys: string[]
  get(key: string): Input<A> | undefined
}

export interface ArrayInput<A> extends BaseInput<A> {
  type: 'array'
  value: unknown[]
  length: number
  at(idx: number): Input<A>
  annotationAt(idx: number): A
}

type AddedDiff<A, V> = {
  action: 'added'
  isChanged: true
  fromValue: null | undefined
  toValue: V
  annotation: A
}

type RemovedDiff<A, V> = {
  action: 'removed'
  isChanged: true
  fromValue: V
  toValue: null | undefined
  annotation: A
}

type ChangedDiff<A, V> = {
  action: 'changed'
  isChanged: true
  fromValue: V
  toValue: V
  annotation: A
}

// eslint-disable-next-line no-unused-vars
type UnchangedDiff<A, V> = {
  action: 'unchanged'
  isChanged: false
  fromValue: V
  toValue: V
}

type FullDiff<A, V, P> = (
  | AddedDiff<A, V>
  | RemovedDiff<A, V>
  | ChangedDiff<A, V>
  | UnchangedDiff<A, V>
) &
  P

export type StringDiff<A> = FullDiff<A, string, {type: 'string'; segments: StringDiffSegment<A>[]}>
export type NumberDiff<A> = FullDiff<A, number, {type: 'number'}>
export type BooleanDiff<A> = FullDiff<A, boolean, {type: 'boolean'}>
export type TypeChangeDiff<A> = {
  type: 'typeChange'
  action: 'changed'
  isChanged: true

  fromType: string
  fromValue: unknown
  fromDiff: Diff<A> & {action: 'removed'}

  toType: string
  toValue: unknown
  toDiff: Diff<A> & {action: 'added'}

  annotation: A
}

export type ObjectDiff<A, T extends object = Record<string, any>> = FullDiff<
  A,
  T,
  {
    type: 'object'
    fields: Record<keyof T, Diff<A>>
  }
>
export type ArrayDiff<A, V = unknown> = FullDiff<A, V[], {type: 'array'; items: ItemDiff<A>[]}>
export type NullDiff<A> = FullDiff<A, null, {type: 'null'}>

export type Diff<A> =
  | NullDiff<A>
  | StringDiff<A>
  | NumberDiff<A>
  | BooleanDiff<A>
  | ObjectDiff<A>
  | ArrayDiff<A>
  | TypeChangeDiff<A>

export type StringDiffSegment<A> = StringSegmentChanged<A> | StringSegmentUnchanged

export type StringSegmentChanged<A> = {
  type: 'stringSegment'
  action: 'added' | 'removed'
  text: string
  annotation: A
}

export type StringSegmentUnchanged = {
  type: 'stringSegment'
  action: 'unchanged'
  text: string
}

export type ItemDiff<A> = {
  fromIndex: number | undefined
  toIndex: number | undefined
  hasMoved: boolean
  diff: Diff<A>
  annotation: A
}
