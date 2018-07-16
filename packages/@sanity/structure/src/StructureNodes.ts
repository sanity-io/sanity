import {DocumentListBuilder, DocumentList} from './DocumentList'
import {EditorBuilder} from './Editor'
import {ListItemBuilder} from './ListItem'
import {ListBuilder, List} from './List'
import {MenuItemBuilder} from './MenuItem'
import {MenuItemGroupBuilder} from './MenuItemGroup'

export interface StructureNode {
  id: string
  title?: string
  type?: string
}

export interface EditorNode extends StructureNode {
  options: {
    id: string
    type: string
  }
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

export type Collection = List | DocumentList | EditorNode

export type CollectionBuilder = ListBuilder | DocumentListBuilder | EditorBuilder

export type Builder = CollectionBuilder | ListItemBuilder | MenuItemBuilder | MenuItemGroupBuilder
