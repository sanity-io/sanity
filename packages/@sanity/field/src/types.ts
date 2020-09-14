import {ComponentType} from 'react'
import {
  // Base diffs
  ArrayDiff as AgnosticArrayDiff,
  BooleanDiff as AgnosticBooleanDiff,
  NullDiff as AgnosticNullDiff,
  NumberDiff as AgnosticNumberDiff,
  ObjectDiff as AgnosticObjectDiff,
  StringDiff as AgnosticStringDiff,
  TypeChangeDiff as AgnosticTypeChangeDiff,

  // Diff internals
  ItemDiff as AgnosticItemDiff,
  StringSegmentChanged as AgnosticStringSegmentChanged,
  StringSegmentUnchanged as AgnosticStringSegmentUnchanged
} from '@sanity/diff'
import {Path} from './paths'
import {FieldValueError} from './validation'

/**
 * History timeline / chunking
 */
export type ChunkType =
  | 'initial'
  | 'create'
  | 'editDraft'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'discardDraft'

export type Chunk = {
  index: number

  id: string
  type: ChunkType
  start: number
  end: number
  startTimestamp: string
  endTimestamp: string
  authors: Set<string>
}

/**
 * Annotation connected to a change
 */
export type AnnotationDetails = {
  chunk: Chunk
  timestamp: string
  author: string
}

export type Annotation = AnnotationDetails | null

/**
 * Diff types with annotation type set automatically
 */
export type ArrayDiff<V = unknown> = AgnosticArrayDiff<Annotation, V>
export type BooleanDiff = AgnosticBooleanDiff<Annotation>
export type NullDiff = AgnosticNullDiff<Annotation>
export type NumberDiff = AgnosticNumberDiff<Annotation>
export type ObjectDiff<T extends object = Record<string, any>> = AgnosticObjectDiff<Annotation, T>
export type StringDiff = AgnosticStringDiff<Annotation>
export type ReferenceDiff = ObjectDiff<Reference>
export type TypeChangeDiff = AgnosticTypeChangeDiff<Annotation>

export type Diff<A = unknown, O extends object = Record<string, any>> =
  | ArrayDiff<A>
  | BooleanDiff
  | NullDiff
  | NumberDiff
  | ObjectDiff<O>
  | StringDiff
  | TypeChangeDiff

export type StringDiffSegment = StringSegmentChanged | StringSegmentUnchanged
export type StringSegmentChanged = AgnosticStringSegmentChanged<Annotation>
export type StringSegmentUnchanged = AgnosticStringSegmentUnchanged

export type ItemDiff = AgnosticItemDiff<Annotation>

/**
 * Diff extensions for presentational concerns
 */
export interface ArrayItemMetadata {
  fromType?: SchemaType
  toType?: SchemaType
}

/**
 * Diff components
 */
export type DiffComponent<T extends Diff = Diff> = ComponentType<DiffProps<T>>
export type DiffComponentOptions<T extends Diff = Diff> = {
  component: DiffComponent<T>
  renderHeader: boolean
}

export type DiffProps<T extends Diff = Diff> = {
  diff: T
  childChanges?: any
  schemaType: T extends ObjectDiff
    ? ObjectSchemaType
    : T extends ArrayDiff
    ? ArraySchemaType
    : T extends BooleanDiff
    ? BooleanSchemaType
    : T extends StringDiff
    ? StringSchemaType
    : T extends NumberDiff
    ? NumberSchemaType
    : SchemaType
}

/**
 * Resolvers
 */
export type DiffComponentResolver = (options: {
  schemaType: SchemaType
}) => React.ComponentType<any> | DiffComponentOptions<any> | undefined

/**
 * Schema
 */

// Note: INCOMPLETE, but good enough for diffs
export interface BaseSchemaType {
  name: string
  title?: string
  description?: string
  type?: SchemaType
  diffComponent?: DiffComponent<any> | DiffComponentOptions<any>
}

export interface StringSchemaType extends BaseSchemaType {
  jsonType: 'string'
  options?: {
    list?: {title?: string; value: string}[]
    layout?: 'radio' | 'dropdown'
    direction?: 'horizontal' | 'vertical'

    // Actually just part of date time, but can't find a good way to differentiate
    dateFormat?: string
    timeFormat?: string
  }
}

export interface NumberSchemaType extends BaseSchemaType {
  jsonType: 'number'
}

export interface BooleanSchemaType extends BaseSchemaType {
  jsonType: 'boolean'
  options?: {
    layout: 'checkbox' | 'switch'
  }
}

export interface ArraySchemaType<V = unknown> extends BaseSchemaType {
  jsonType: 'array'
  of: Exclude<SchemaType, ArraySchemaType>[]
  diffComponent?: DiffComponent<ArrayDiff<V>> | DiffComponentOptions<ArrayDiff<V>>
}

export interface ObjectField<T extends SchemaType = SchemaType> {
  name: string
  fieldset?: string
  type: T
}

export interface ObjectSchemaType<T extends object = Record<string, any>> extends BaseSchemaType {
  jsonType: 'object'
  fields: ObjectField[]
  fieldsets?: Fieldset[]
  diffComponent?: DiffComponent<ObjectDiff<T>> | DiffComponentOptions<ObjectDiff<T>>
}

export interface SingleFieldSet {
  single: true
  field: ObjectField
}

export interface MultiFieldSet {
  name: string
  title?: string
  description?: string
  single?: false
  options?: {
    collapsible?: boolean
    collapsed?: boolean
    columns?: number
  }
  fields: ObjectField[]
}

export type Fieldset = SingleFieldSet | MultiFieldSet

export interface Reference {
  _ref: string
  _key?: string
  _weak?: boolean
}

export type ReferenceSchemaType = ObjectSchemaType<Reference> & {
  to: SchemaType[]
}

export type SchemaType<A = unknown, O extends object = Record<string, any>> =
  | ArraySchemaType<A>
  | BooleanSchemaType
  | NumberSchemaType
  | ObjectSchemaType<O>
  | StringSchemaType

/**
 * Paths
 */
export * from './paths/types'

/**
 * "Changes" (presentation-oriented grouping of diffs)
 */
export interface GroupChangeNode {
  type: 'group'
  changes: ChangeNode[]
  key: string
  path: Path
  titlePath: ChangeTitlePath
}

export interface FieldChangeNode {
  type: 'field'
  diff: Diff
  itemDiff?: ItemDiff
  parentDiff?: ObjectDiff | ArrayDiff
  key: string
  path: Path
  error?: FieldValueError
  titlePath: ChangeTitlePath
  schemaType: SchemaType
  renderHeader: boolean
  diffComponent?: DiffComponent
}

export type ChangeNode = GroupChangeNode | FieldChangeNode

export interface FromToIndex {
  hasMoved: boolean
  fromIndex?: number
  toIndex?: number
  annotation?: Annotation
}

export type ChangeTitlePath = (string | FromToIndex)[]

/**
 * Document operations API + patches
 * @todo remove - should be imported from somewhere else
 */
export type InsertPatch =
  | {before: string; items: unknown[]}
  | {after: string; items: unknown[]}
  | {replace: string; items: unknown[]}

export interface PatchOperations {
  set?: {[key: string]: unknown}
  setIfMissing?: {[key: string]: unknown}
  merge?: {[key: string]: unknown}
  diffMatchPatch?: {[key: string]: unknown}
  unset?: string[]
  inc?: {[key: string]: number}
  dec?: {[key: string]: number}
  insert?: InsertPatch
  ifRevisionID?: string
}

export interface OperationsAPI {
  patch: {
    execute: (patches: PatchOperations[]) => void
  }
}

/**
 * From sanity-diff-patch
 */
export interface SetDiffPatch {
  op: 'set'
  path: Path
  value: unknown
}

export interface UnsetDiffPatch {
  op: 'unset'
  path: Path
}

export interface InsertDiffPatch {
  op: 'insert'
  after: Path
  items: unknown[]
}

export type DiffPatch = SetDiffPatch | UnsetDiffPatch | InsertDiffPatch

/**
 * Document/object value types
 */
export interface SanityDocument {
  [key: string]: unknown
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  _rev: string
}

export interface TypedObject {
  [key: string]: unknown
  _type: string
}

export interface KeyedObject {
  [key: string]: unknown
  _key: string
}
