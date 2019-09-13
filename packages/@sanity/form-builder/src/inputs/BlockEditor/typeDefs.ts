import {List} from 'immutable'
import {ComponentType} from 'react'
import {
  Block as SlateBlock,
  Change,
  Editor as _SlateEditor,
  Inline,
  Mark,
  Operation as _SlateOperation,
  Schema as _SlateSchema,
  Selection as _SlateSelection,
  Text,
  Value as _SlateValue
} from 'slate'
import {Patch as _Patch} from '../../typedefs/patch'
import {Marker as _Marker} from '../../typedefs'

export type Patch = _Patch

export type Type = {
  type: Type
  name: string
  title: string
  options?: Record<string, any>
  of?: any[]
  icon?: any
  readOnly?: boolean
  annotations?: {title: string; name: string}[]
}

export type BlockArrayType = Type & {
  name: string
  title: string
  description: string
  readOnly: boolean | null
  options: {
    editModal: 'fold' | 'modal'
    sortable: boolean
    layout?: 'grid'
  }
  of: Type[]
}

export type Span = {
  _key: string
  text: string
  marks: string[]
}

export type MarkDef = {_key: string; _type: string}

export type Block = {
  _type: string
  _key: string
  children: Span[]
  markDefs: MarkDef[]
}

export type SlateNode = SlateBlock | Inline | Text | Mark

export type SlateMarkProps = {
  attributes: {}
  mark: {
    type: string
  }
  children: SlateNode[]
}

export type BlockItem = {
  type: Type
  title: string
}

export type SlateValue = _SlateValue
export type SlateOperation = _SlateOperation

export type SlateChange = Change

export type SlateEditor = _SlateEditor

export type Annotation = any

export type BlockContentFeature = {
  title: string
  value: string
  blockEditor?: {
    icon?: string | ComponentType<any>
    render?: ComponentType<any>
  }
  type: Type
}

export type BlockContentFeatures = {
  decorators: BlockContentFeature[]
  styles: BlockContentFeature[]
  annotations: BlockContentFeature[]
  lists: BlockContentFeature[]
  types: {
    block: Type
    span: Type
    blockContent: Type
    inlineObjects: Type[]
    blockObjects: Type[]
  }
}

export type SlateComponentProps = {
  attributes?: {}
  children: React.ReactNode
  editor: SlateEditor
  isFocused?: boolean
  isSelected?: boolean
  key?: string
  node: SlateNode
  parent?: any
  readOnly?: boolean
  blockContentFeatures?: BlockContentFeatures
}

export type Marker = _Marker

export type SlateSchema = _SlateSchema

export type SlateSelection = _SlateSelection

export type FormBuilderValue =
  | {
      _type?: string
      _key: string
      _ref?: string
    }
  | Block

export type FormBuilderSchema = {
  name: string
  types: Array<Type>
}

export {Path} from '../../typedefs/path'

export type UndoRedoStackItem = {
  operations: List<SlateOperation>
  remoteOperations: List<SlateOperation>
  beforeSelection: SlateSelection
  afterSelection: SlateSelection
}

export type UndoRedoStack = {undo: UndoRedoStackItem[]; redo: UndoRedoStackItem[]}

export type RenderBlockActions = (arg0: {
  block: FormBuilderValue
  value: FormBuilderValue[]
  set: (arg0: FormBuilderValue) => void
  unset: (arg0: FormBuilderValue) => void
  insert: (arg0: FormBuilderValue) => void
}) => React.ReactElement

export type RenderCustomMarkers = (arg0: Marker[]) => React.ReactElement

export type ChangeSet = {
  editorValue: SlateValue
  isRemote: 'remote' | 'internal'
  operations: List<SlateOperation>
  patches: Patch[]
  selection: SlateSelection
  callback: (arg0: void) => void
}
