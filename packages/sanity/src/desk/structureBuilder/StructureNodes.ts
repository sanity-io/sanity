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
   * Document children
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
   * Views for the document pane
   */
  views: View[]
}

/**
 * Interface for Editor node
 *
 * @public */
export interface EditorNode extends StructureNode {
  /* Editor Id */
  child?: Child
  /* Editor options */
  options: {
    /* Editor ID */
    id: string
    /* Editor type */
    type?: string
    /* Editor template */
    template?: string
    /* Template parameters */
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
 * Type for the path of a serialized structure node
 *
 * @public
 */
export type SerializePath = (string | number)[]

/**
 * Interface for seraializing a structure node
 * @public */
export interface SerializeOptions {
  /* path */
  path: SerializePath
  /* index */
  index?: number
  /* hint */
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
 * Type for a collection
 *
 * @public
 */
export type Collection = List | DocumentList | EditorNode | DocumentNode | Component

/**
 * Type for a collection builder
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
 * Type for Child of a structure node
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
