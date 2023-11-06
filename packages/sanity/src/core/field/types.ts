import type {
  Path,
  Reference,
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  StringSchemaType,
  ObjectFieldType,
  ConditionalProperty,
  SchemaType,
  PatchOperations,
} from '@sanity/types'
import type {ComponentType} from 'react'
import type {
  ArrayDiff as AgnosticArrayDiff,
  BooleanDiff as AgnosticBooleanDiff,
  ItemDiff as AgnosticItemDiff,
  NullDiff as AgnosticNullDiff,
  NumberDiff as AgnosticNumberDiff,
  ObjectDiff as AgnosticObjectDiff,
  StringDiff as AgnosticStringDiff,
  StringSegmentChanged as AgnosticStringSegmentChanged,
  StringSegmentUnchanged as AgnosticStringSegmentUnchanged,
  TypeChangeDiff as AgnosticTypeChangeDiff,
} from '@sanity/diff'
import type {FieldValueError} from './validation'

/**
 * History timeline / chunking
 *
 *
 * @hidden
 * @beta
 */
export type ChunkType =
  | 'initial'
  | 'create'
  | 'editDraft'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'discardDraft'
  | 'editLive'

/**
 * @hidden
 * @beta */
export type Chunk = {
  index: number

  id: string
  type: ChunkType
  start: number
  end: number
  startTimestamp: string
  endTimestamp: string
  authors: Set<string>
  draftState: 'present' | 'missing' | 'unknown'
  publishedState: 'present' | 'missing' | 'unknown'
}

/**
 * Annotation connected to a change
 *
 *
 * @hidden
 * @beta
 */
export type AnnotationDetails = {
  chunk: Chunk
  timestamp: string
  author: string
}

/**
 * @hidden
 * @beta */
export type Annotation = AnnotationDetails | null

// Diff types with annotation type set automatically

/** @internal */
export type ArrayDiff<V = unknown> = AgnosticArrayDiff<Annotation, V>

/** @internal */
export type BooleanDiff = AgnosticBooleanDiff<Annotation>

/** @internal */
export type NullDiff = AgnosticNullDiff<Annotation>

/** @internal */
export type NumberDiff = AgnosticNumberDiff<Annotation>

/** @internal */
export type ObjectDiff<T extends object = Record<string, any>> = AgnosticObjectDiff<Annotation, T>

/** @internal */
export type StringDiff = AgnosticStringDiff<Annotation>

/** @internal */
export type ReferenceDiff = ObjectDiff<Reference>

/** @internal */
export type TypeChangeDiff = AgnosticTypeChangeDiff<Annotation>

/** @internal */
export type Diff<A = unknown, O extends object = Record<string, any>> =
  | ArrayDiff<A>
  | BooleanDiff
  | NullDiff
  | NumberDiff
  | ObjectDiff<O>
  | StringDiff
  | TypeChangeDiff

/** @internal */
export type StringDiffSegment = StringSegmentChanged | StringSegmentUnchanged

/** @internal */
export type StringSegmentChanged = AgnosticStringSegmentChanged<Annotation>

/** @internal */
export type StringSegmentUnchanged = AgnosticStringSegmentUnchanged

/** @internal */
export type ItemDiff = AgnosticItemDiff<Annotation>

/**
 * Diff extensions for presentational concerns
 *
 * @internal
 */
export interface ArrayItemMetadata {
  fromType?: SchemaType
  toType?: SchemaType
}

/**
 * Diff components
 *
 * @internal
 */
export type DiffComponent<T extends Diff = Diff> = ComponentType<DiffProps<T>>

/** @internal */
export type DiffComponentOptions<T extends Diff = Diff> = {
  component: DiffComponent<T>
  showHeader?: boolean
}

/** @internal */
export type DiffProps<T extends Diff = Diff> = {
  diff: T
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
 *
 * @internal
 */
export type DiffComponentResolver = (options: {
  schemaType: SchemaType
  parentSchemaType?: ArraySchemaType | ObjectSchemaType
}) => React.ComponentType<any> | DiffComponentOptions<any> | undefined

/**
 * Schema
 */

// Note: INCOMPLETE, but good enough for diffs
// export interface BaseSchemaType extends BaseGenericSchemaType {
//   diffComponent?: DiffComponent<any> | DiffComponentOptions<any>
// }

// export interface StringSchemaType extends BaseStringSchemaType {
//   diffComponent?: DiffComponent<StringDiff> | DiffComponentOptions<StringDiff>
// }

// export interface NumberSchemaType extends BaseNumberSchemaType {
//   diffComponent?: DiffComponent<NumberDiff> | DiffComponentOptions<NumberDiff>
// }

// export interface BooleanSchemaType extends BaseBooleanSchemaType {
//   diffComponent?: DiffComponent<BooleanDiff> | DiffComponentOptions<BooleanDiff>
// }

// export interface ArraySchemaType<V = unknown> extends BaseArraySchemaType {
//   diffComponent?: DiffComponent<ArrayDiff<V>> | DiffComponentOptions<ArrayDiff<V>>
// }

// export interface BlockSchemaType<O> extends BaseBlockSchemaType {
//   diffComponent?: DiffComponent<ObjectDiff<Block<O>>> | DiffComponentOptions<ObjectDiff<Block<O>>>
// }

// export interface ObjectSchemaType<T extends object = Record<string, any>>
//   extends BaseObjectSchemaType {
//   diffComponent?: DiffComponent<ObjectDiff<T>> | DiffComponentOptions<ObjectDiff<T>>
// }

// export interface ReferenceSchemaType extends BaseReferenceSchemaType {
//   diffComponent?: DiffComponent<ObjectDiff<Reference>> | DiffComponentOptions<ObjectDiff<Reference>>
// }

// export type SchemaType<A = unknown, O extends object = Record<string, any>> =
//   | ArraySchemaType<A>
//   | BooleanSchemaType
//   | NumberSchemaType
//   | ObjectSchemaType<O>
//   | StringSchemaType

/**
 * "Changes" (presentation-oriented grouping of diffs)
 *
 * @internal
 */
export interface GroupChangeNode {
  type: 'group'
  changes: ChangeNode[]
  key: string
  path: Path
  titlePath: ChangeTitlePath
  schemaType?: SchemaType
  readOnly?: ConditionalProperty
  hidden?: ConditionalProperty
  fieldsetName?: string
}

/** @internal */
export interface FieldChangeNode {
  type: 'field'
  diff: Diff
  itemDiff?: ItemDiff
  parentDiff?: ObjectDiff | ArrayDiff
  key: string
  path: Path
  error?: FieldValueError
  titlePath: ChangeTitlePath
  schemaType: ObjectFieldType
  showHeader: boolean
  showIndex: boolean
  diffComponent?: DiffComponent
  parentSchema?: ArraySchemaType | ObjectSchemaType
  readOnly?: ConditionalProperty
  hidden?: ConditionalProperty
}

/** @internal */
export type ChangeNode = GroupChangeNode | FieldChangeNode

/** @internal */
export interface FromToIndex {
  hasMoved: boolean
  fromIndex?: number
  toIndex?: number
  annotation?: Annotation
}

/** @internal */
export type ChangeTitlePath = (string | FromToIndex)[]

/** @internal */
export interface FieldOperationsAPI {
  patch: {
    execute: (patches: PatchOperations[]) => void
  }
}
