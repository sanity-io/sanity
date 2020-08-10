import {ArrayDiff, Diff, Path} from '@sanity/diff'
import {Annotation} from '../history/types'
import {SchemaType} from '../types'

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

export interface ArrayItemMetadata {
  fromType?: {name: string}
  toType?: {name: string}
}

export interface FieldChangeNode {
  type: 'field'
  diff: Diff<Annotation>
  key: string
  path: Path
  titlePath: string[]
  schemaType: SchemaType
}

export interface ArrayChangeNode {
  type: 'array'
  diff: ArrayDiff<Annotation>
  key: string
  path: Path
  titlePath: string[]
  schemaType: SchemaType
  items: ArrayItemMetadata[]
}

export type ChangeNode = GroupChangeNode | FieldChangeNode | ArrayChangeNode
