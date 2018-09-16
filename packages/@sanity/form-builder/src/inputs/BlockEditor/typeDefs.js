// @flow
import type {Node, ComponentType} from 'react'
import type {
  Change,
  Block as SlateBlock,
  Mark,
  Inline,
  Text,
  Value as _SlateValue,
  Operation as _SlateOperation,
  Schema as _SlateSchema,
  Selection as _SlateSelection
} from 'slate'
import type {Patch as _Patch} from '../../typedefs/patch'
import {Path as _Path} from '../../typedefs/path'
import {Marker as _Marker} from '../../typedefs'

export type Patch = _Patch

export type Type = {
  type: Type,
  name: string,
  title: string,
  options?: Object,
  of?: [],
  readOnly?: boolean,
  annotations?: {title: string, name: string}[]
}

export type BlockArrayType = Type & {
  name: string,
  title: string,
  description: string,
  readOnly: ?boolean,
  options: {
    editModal: 'fold' | 'modal',
    sortable: boolean,
    layout?: 'grid'
  },
  of: Type[]
}

export type Span = {
  _key: string,
  text: string
}

export type MarkDef = {_key: string, _type: string}

export type Block = {
  _type: string,
  _key: string,
  children: Span[],
  markDefs: MarkDef[]
}

export type SlateNode = SlateBlock | Inline | Text | Mark

export type SlateMarkProps = {
  attributes: {},
  mark: {
    type: string
  },
  children: Node[]
}

export type BlockItem = {
  type: Type,
  title: string
}

export type SlateValue = _SlateValue
export type SlateOperation = _SlateOperation

export type SlateChange = Change

export type Annotation = any

export type BlockContentFeature = {
  title: string,
  value: string,
  blockEditor?: {
    icon?: string | ComponentType<*>,
    render?: ComponentType<*>
  },
  type: Type
}

export type BlockContentFeatures = {
  decorators: BlockContentFeature[],
  styles: BlockContentFeature[],
  annotations: BlockContentFeature[],
  lists: BlockContentFeature[],
  types: {
    block: Type,
    span: Type,
    blockContent: Type,
    inlineObjects: Type[],
    blockObjects: Type[]
  }
}

export type SlateComponentProps = {
  attributes?: {},
  children: Node[],
  editor?: Node,
  isFocused?: boolean,
  isSelected?: boolean,
  key?: string,
  node: SlateNode,
  parent?: any,
  readOnly?: boolean,
  blockContentFeatures?: BlockContentFeatures
}

export type Marker = _Marker

export type UndoRedoStack = {
  undo: {
    patches: Patch[],
    editorValue: SlateValue,
    select: any
  }[],
  redo: {
    patches: Patch[],
    editorValue: SlateValue,
    select: any
  }[]
}

export type Path = _Path

export type SlateSchema = _SlateSchema

export type SlateSelection = _SlateSelection

export type FormBuilderValue = {
  _type?: string,
  _key: string,
  _ref?: string
}

export type FormBuilderSchema = {
  name: string,
  types: Array<Type>
}
