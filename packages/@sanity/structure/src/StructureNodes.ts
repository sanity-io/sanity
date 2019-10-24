import {DocumentListBuilder, DocumentList} from './DocumentList'
import {EditorBuilder} from './Editor'
import {ListItemBuilder} from './ListItem'
import {ListBuilder, List} from './List'
import {MenuItemBuilder} from './MenuItem'
import {MenuItemGroupBuilder} from './MenuItemGroup'
import {Component, ComponentBuilder} from './Component'
import {DocumentListItemBuilder} from './DocumentListItem'
import {ChildResolver} from './ChildResolver'
import {DocumentTypeListBuilder} from './DocumentTypeList'
import {InitialValueTemplateItemBuilder} from './InitialValueTemplateItem'

export interface StructureNode {
  id: string
  title?: string
  type?: string
}

export interface EditorNode extends StructureNode {
  options: {
    id: string
    type?: string
    template?: string
    templateParameters?: {[key: string]: any}
  }
}

export interface Divider {
  id: string
  type: 'divider'
}

export type SerializePath = (string | number)[]

export interface SerializeOptions {
  path: SerializePath
  index?: number
  hint?: string
}

export interface Serializable {
  serialize(options: SerializeOptions): {}
}

export type Collection = List | DocumentList | EditorNode | Component

export type CollectionBuilder =
  | ListBuilder
  | DocumentListBuilder
  | DocumentTypeListBuilder
  | EditorBuilder
  | ComponentBuilder

export type Child = Collection | CollectionBuilder | ChildResolver

export type Builder =
  | CollectionBuilder
  | ComponentBuilder
  | DocumentListBuilder
  | DocumentListItemBuilder
  | ListItemBuilder
  | MenuItemBuilder
  | MenuItemGroupBuilder
  | InitialValueTemplateItemBuilder
