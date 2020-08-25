import {Diff, Path, SchemaType} from '@sanity/field/diff'

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
