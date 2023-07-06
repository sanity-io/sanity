import type {DocumentListBuilder, DocumentList} from './DocumentList'
import type {ListItemBuilder} from './ListItem'
import type {ListBuilder, List} from './List'
import type {MenuItemBuilder} from './MenuItem'
import type {MenuItemGroupBuilder} from './MenuItemGroup'
import type {Component, ComponentBuilder} from './Component'
import type {DocumentListItemBuilder} from './DocumentListItem'
import type {ChildResolver} from './ChildResolver'
import type {DocumentTypeListBuilder} from './DocumentTypeList'
import type {InitialValueTemplateItemBuilder} from './InitialValueTemplateItem'
import type {DocumentBuilder} from './Document'
import type {View} from './types'

/**
 * @hidden
 * @beta */
export interface StructureNode {
  id: string
  title?: string
  type?: string
}

/**
 * @hidden
 * @beta */
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

/**
 * @hidden
 * @beta */
export interface EditorNode extends StructureNode {
  child?: Child
  options: {
    id: string
    type?: string
    template?: string
    templateParameters?: {[key: string]: any}
  }
}

/**
 * @hidden
 * @beta */
export interface Divider {
  id: string
  type: 'divider'
}

/**
 * @hidden
 * @beta */
export type SerializePath = (string | number)[]

/**
 * @hidden
 * @beta */
export interface SerializeOptions {
  path: SerializePath
  index?: number
  hint?: string
}

/**
 * @hidden
 * @beta */
export interface Serializable<T> {
  serialize(options: SerializeOptions): T
}

/**
 * @hidden
 * @beta */
export type Collection = List | DocumentList | EditorNode | DocumentNode | Component

/**
 * @hidden
 * @beta */
export type CollectionBuilder =
  | ListBuilder
  | DocumentListBuilder
  | DocumentTypeListBuilder
  | DocumentBuilder
  | ComponentBuilder

/**
 * @hidden
 * @beta */
export type Child = Collection | CollectionBuilder | ChildResolver

/** @internal */
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
