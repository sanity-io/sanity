export type DiffOptions = {}

export type Annotation = {}

export type SimpleDiff<A = Annotation> = StringDiff<A> | NumberDiff<A> | BooleanDiff<A>
export type ValueType = 'array' | 'boolean' | 'null' | 'number' | 'object' | 'string' | 'undefined'

export type PathSegment = string | number | {_key: string}
export type Path = PathSegment[]

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
  value: object
  keys: string[]
  get(key: string): Input<A> | undefined
}

export interface ArrayInput<A> extends BaseInput<A> {
  type: 'array'
  value: unknown[]
  length: number
  at(idx: number): Input<A>
}

export type NoDiff = {
  type: 'unchanged'
  isChanged: false
  fromValue: unknown
  toValue: unknown
}

interface BaseDiff<A> {
  type: 'array' | 'boolean' | 'number' | 'object' | 'string' | 'typeChange'
  isChanged: true
  fromValue: unknown
  toValue: unknown
}

export type Diff<A = Annotation> =
  | StringDiff<A>
  | NumberDiff<A>
  | BooleanDiff<A>
  | ObjectDiff<A>
  | ArrayDiff<A>
  | TypeChangeDiff<A>

export interface NumberDiff<A> extends BaseDiff<A> {
  type: 'number'
  fromValue: number
  toValue: number
  annotation: A
}

export interface BooleanDiff<A> extends BaseDiff<A> {
  type: 'boolean'
  fromValue: boolean
  toValue: boolean
  annotation: A
}

export interface TypeChangeDiff<A> extends BaseDiff<A> {
  type: 'typeChange'
  fromValue: unknown
  fromType: ValueType
  toValue: unknown
  toType: ValueType
  annotation: A
}

export interface StringDiff<A = Annotation> extends BaseDiff<A> {
  type: 'string'
  fromValue: string
  toValue: string
  segments: StringDiffSegment<A>[]
}

export type StringDiffSegment<A = Annotation> = StringSegmentChanged<A> | StringSegmentUnchanged

export type StringSegmentChanged<A> = {
  type: 'added' | 'removed'
  text: string
  annotation: A
}

export type StringSegmentUnchanged = {
  type: 'unchanged'
  text: string
}

export interface ObjectDiff<A, V extends {} = object> extends BaseDiff<A> {
  type: 'object'
  fromValue: V | undefined | null
  toValue: V | undefined | null
  fields: {[fieldName: string]: FieldDiff<A>}
}

export type FieldDiff<A> =
  | FieldDiffChanged<A>
  | FieldDiffUnchanged<A>
  | FieldDiffAdded<A>
  | FieldDiffRemoved<A>

interface FieldDiffBase<A> {
  type: 'changed' | 'unchanged' | 'added' | 'removed'
  isChanged: boolean
  fromValue: unknown
  toValue: unknown
}

export interface FieldDiffChanged<A> extends FieldDiffBase<A> {
  type: 'changed'
  isChanged: true
  diff: Diff<A>
}

export interface FieldDiffUnchanged<A> extends FieldDiffBase<A> {
  type: 'unchanged'
  isChanged: false
}

export interface FieldDiffAdded<A> extends FieldDiffBase<A> {
  type: 'added'
  isChanged: true
  fromValue: undefined | null
  annotation: A
}

export interface FieldDiffRemoved<A> extends FieldDiffBase<A> {
  type: 'removed'
  isChanged: true
  toValue: undefined | null
  annotation: A
}

export interface ArrayDiff<A> extends BaseDiff<A> {
  type: 'array'
  fromValue: unknown[]
  toValue: unknown[]
  items: ItemDiff<A>[]
}

export type ItemDiff<A> =
  | ItemDiffChanged<A>
  | ItemDiffUnchanged<A>
  | ItemDiffAdded<A>
  | ItemDiffRemoved<A>

type ItemDiffBase<A> = {
  type: 'changed' | 'unchanged' | 'added' | 'removed'
  isChanged: boolean
  fromValue: unknown
  toValue: unknown
  fromIndex: number | undefined
  toIndex: number | undefined
  hasMoved: boolean
}

export interface ItemDiffChanged<A> extends ItemDiffBase<A> {
  type: 'changed'
  isChanged: true
  fromIndex: number
  toIndex: number
  diff: Diff<A>
}

export interface ItemDiffUnchanged<A> extends ItemDiffBase<A> {
  type: 'unchanged'
  isChanged: false
  fromIndex: number
  toIndex: number
}

export interface ItemDiffAdded<A> extends ItemDiffBase<A> {
  type: 'added'
  isChanged: true
  fromIndex: undefined
  toIndex: number
  hasMoved: false
  fromValue: undefined
  annotation: A
}

export interface ItemDiffRemoved<A> extends ItemDiffBase<A> {
  type: 'removed'
  isChanged: true
  fromIndex: number
  toIndex: undefined
  hasMoved: false
  toValue: undefined
  annotation: A
}
