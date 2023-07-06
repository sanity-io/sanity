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
 * Interface for the structure builder node.
 *
 * @public
 */
export interface StructureNode {
  /** Node ID */
  id: string
  /** Node ID */
  title?: string
  /** Node type */
  type?: string
}

/**
 * Interface for the document list builder (focused on the document pane)
 *
 * @public */
export interface DocumentNode extends StructureNode {
  /**
   * Document children. See {@link Child}
   */
  child?: Child
  /**
   * Options for the document pane
   */
  options: {
    /** Document Id */
    id: string
    /** Document Type */
    type?: string
    /** Document Template */
    template?: string
    /** Template parameters */
    templateParameters?: {[key: string]: any}
  }
  /**
   * View array for the document pane. See {@link View}
   */
  views: View[]
}

/**
 * Interface for Editor node
 *
 * @public */
export interface EditorNode extends StructureNode {
  /** Editor child. See {@link Child} */
  child?: Child
  /** Editor options */
  options: {
    /** Editor ID */
    id: string
    /** Editor type */
    type?: string
    /** Editor template */
    template?: string
    /** Template parameters */
    templateParameters?: {[key: string]: any}
  }
}

/**
 * A `Divider` is a visual separator in the structure tree.
 *
 * @public
 */
export interface Divider {
  /**
   * The divider's ID
   */
  id: string
  type: 'divider'
}

/**
 * Path of a serialized structure node
 *
 * @public
 */
export type SerializePath = (string | number)[]

/**
 * Interface for seraializing a structure node
 * @public */
export interface SerializeOptions {
  /** path. See {@link SerializePath} */
  path: SerializePath
  /** index */
  index?: number
  /** hint */
  hint?: string
}

/**
 *  A interface for serializing a structure node to a plain JavaScript object.
 *
 * @public
 */
export interface Serializable<T> {
  serialize(options: SerializeOptions): T
}

/**
 * Collection
 * See {@link List}, {@link DocumentList}, {@link EditorNode}, {@link DocumentNode} and {@link Component}
 *
 * @public
 */
export type Collection = List | DocumentList | EditorNode | DocumentNode | Component

/**
 * Collection builder
 * See {@link ListBuilder}, {@link DocumentListBuilder}, {@link DocumentTypeListBuilder}, {@link DocumentBuilder} and {@link ComponentBuilder}
 *
 * @public
 */
export type CollectionBuilder =
  | ListBuilder
  | DocumentListBuilder
  | DocumentTypeListBuilder
  | DocumentBuilder
  | ComponentBuilder

/**
 * Child of a structure node
 * See {@link Collection}, {@link CollectionBuilder} and {@link ChildResolver}
 *
 * @public
 */
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
