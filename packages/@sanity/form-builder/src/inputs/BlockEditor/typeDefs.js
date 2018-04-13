// @flow
import type {Map, List} from 'immutable'
import type {Node, ComponentType} from 'react'
import type {Patch as _Patch} from '../../utils/patches'
import type {Marker as _Marker} from '../../typedefs'
import {
  Change,
  Block as SlateBlock,
  Mark,
  Inline,
  Text,
  Value as _SlateValue,
  Operation as _SlateOperation
} from 'slate'

export type Patch = _Patch

export type Type = {
  type: Type,
  name: string,
  title: string,
  options?: Object,
  of?: [],
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

export type Block = {
  _type: string,
  _key: string,
  children?: Span[]
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
  }
}

export type BlockContentFeatures = {
  decorators: BlockContentFeature[],
  styles: BlockContentFeature[],
  annotations: BlockContentFeature[],
  lists: BlockContentFeature[],
  types: {
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
  isSelected?: boolean,
  key?: string,
  node: SlateNode,
  parent?: any,
  readOnly?: boolean,
  blockContentFeatures?: BlockContentFeatures
}

export type Marker = _Marker
