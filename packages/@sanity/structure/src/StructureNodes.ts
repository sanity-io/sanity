import {DocumentListBuilder, DocumentList} from './DocumentList'
import {ListItemBuilder} from './ListItem'
import {ListBuilder, List} from './List'
import {MenuItemBuilder} from './MenuItem'
import {MenuItemGroupBuilder} from './MenuItemGroup'
import {Component, ComponentBuilder} from './Component'
import {DocumentListItemBuilder} from './DocumentListItem'
import {ChildResolver} from './ChildResolver'
import {DocumentTypeListBuilder} from './DocumentTypeList'
import {InitialValueTemplateItemBuilder} from './InitialValueTemplateItem'
import {DocumentBuilder} from './Document'
import {View} from './views/View'

export interface StructureNode {
  id: string
  title?: string
  type?: string
}

export interface DocumentNode extends StructureNode {
  child?: Child
  options: {
    id: string
    type?: string
    template?: string
    templateParameters?: {[key: string]: any}
  }
  views: View[]
}

export interface EditorNode extends StructureNode {
  child?: Child
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

export type Collection = List | DocumentList | EditorNode | DocumentNode | Component

export type CollectionBuilder =
  | ListBuilder
  | DocumentListBuilder
  | DocumentTypeListBuilder
  | DocumentBuilder
  | ComponentBuilder

export type Child = Collection | CollectionBuilder | ChildResolver

export type Builder =
  | CollectionBuilder
  | ComponentBuilder
  | DocumentBuilder
  | DocumentListBuilder
  | DocumentListItemBuilder
  | ListItemBuilder
  | MenuItemBuilder
  | MenuItemGroupBuilder
  | InitialValueTemplateItemBuilder
