import {
  ArrayDiff,
  Diff,
  Path,
  SchemaType,
  ArrayItemMetadata,
  ArraySchemaType
} from '@sanity/field/diff'

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

export interface GroupChangeNode {
  type: 'group'
  changes: ChangeNode[]
  key: string
  path: Path
  titlePath: string[]
}

export interface FieldChangeNode {
  type: 'field'
  diff: Diff
  key: string
  path: Path
  titlePath: string[]
  schemaType: SchemaType
}

export interface ArrayChangeNode {
  type: 'array'
  diff: ArrayDiff
  key: string
  path: Path
  titlePath: string[]
  schemaType: ArraySchemaType
  items: ArrayItemMetadata[]
}

export type ChangeNode = GroupChangeNode | FieldChangeNode | ArrayChangeNode

export interface TypedObject {
  [key: string]: unknown
  _type: string
}

export interface KeyedObject {
  [key: string]: unknown
  _key: string
}
