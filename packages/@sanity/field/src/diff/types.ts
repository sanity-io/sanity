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
import {Path} from '../paths'

/**
 * History timeline / chunking
 */
export type ChunkType = 'create' | 'editDraft' | 'delete' | 'publish' | 'unpublish' | 'discardDraft'

export type Chunk = {
  id: string
  type: ChunkType
  start: number
  end: number
  startTimestamp: Date
  endTimestamp: Date
  authors: Set<string>
}

/**
 * Annotation connected to a change
 */
export type AnnotationDetails = {
  chunk: Chunk
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
export type DateTimeDiff = StringDiff

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

export type DiffProps<T extends Diff = Diff> = {
  diff: T
  childChanges?: any
  schemaType: T extends ObjectDiff
    ? ObjectSchemaType
    : T extends ArrayDiff
    ? ArraySchemaType
    : T extends BooleanDiff
    ? BooleanSchemaType
    : T extends DateTimeDiff
    ? DateTimeSchemaType
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
}) => React.ComponentType<any> | undefined

/**
 * Schema
 */

// Note: INCOMPLETE, but good enough for diffs
export interface BaseSchemaType {
  name: string
  title?: string
  description?: string
  type?: SchemaType
  diffComponent?: DiffComponent<any>
}

export interface StringSchemaType extends BaseSchemaType {
  jsonType: 'string'
  options?: {
    list?: {title?: string; value: string}[]
    layout?: 'radio' | 'dropdown'
    direction?: 'horizontal' | 'vertical'
  }
}

export interface DateTimeSchemaType extends StringSchemaType {
  options?: StringSchemaType['options'] & {
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
  diffComponent?: DiffComponent<ArrayDiff<V>>
}

export interface ObjectField<T extends SchemaType = SchemaType> {
  name: string
  fieldset?: string
  type: T
}

export interface ObjectSchemaType<T extends object = Record<string, any>> extends BaseSchemaType {
  jsonType: 'object'
  fields: ObjectField[]
  diffComponent?: DiffComponent<ObjectDiff<T>>
}

export interface Reference {
  _ref: string
  _key?: string
  _weak?: boolean
}

export type ReferenceSchemaType = ObjectSchemaType<Reference>

export type SchemaType<A = unknown, O extends object = Record<string, any>> =
  | ArraySchemaType<A>
  | BooleanSchemaType
  | NumberSchemaType
  | ObjectSchemaType<O>
  | StringSchemaType

/**
 * Paths
 */
export * from '../paths/types'

/**
 * "Changes" (presentation-oriented grouping of diffs)
 */
export interface GroupChangeNode {
  type: 'group'
  groupType: 'array' | 'object'
  changes: ChangeNode[]
  key: string
  path: Path
  titlePath: ChangeTitlePath
}

export interface FieldChangeNode {
  type: 'field'
  diff: Diff
  key: string
  path: Path
  titlePath: ChangeTitlePath
  schemaType: SchemaType
  diffComponent?: DiffComponent
  childChanges?: ChangeNode[]
}

export type ChangeNode = GroupChangeNode | FieldChangeNode

export interface TypedObject {
  [key: string]: unknown
  _type: string
}

export interface KeyedObject {
  [key: string]: unknown
  _key: string
}

export interface FromToIndex {
  hasMoved: boolean
  fromIndex?: number
  toIndex?: number
}

export type ChangeTitlePath = (string | FromToIndex)[]

/**
 * Document operations API + patches
 * @todo remove - should be imported from somewhere else
 */
export interface OperationsAPI {
  patch: {
    execute: (patches: any[]) => void
  }
}

export interface SetPatch {
  op: 'set'
  path: Path
  value: unknown
}

export interface UnsetPatch {
  op: 'unset'
  path: Path
}

export interface InsertPatch {
  op: 'insert'
  after: Path
  items: any[]
}

export type DiffPatch = SetPatch | UnsetPatch | InsertPatch
