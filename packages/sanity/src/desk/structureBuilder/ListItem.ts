import {SchemaType} from '@sanity/types'
import {Observable} from 'rxjs'
import {SerializeOptions, Serializable, Collection, CollectionBuilder} from './StructureNodes'
import {ChildResolver, ItemChild} from './ChildResolver'
import {DocumentListBuilder} from './DocumentList'
import {SerializeError, HELP_URL} from './SerializeError'
import {ListBuilder} from './List'
import {DocumentBuilder} from './Document'
import {ComponentBuilder} from './Component'
import {validateId} from './util/validateId'
import {StructureContext} from './types'
import {getStructureNodeId} from './util/getStructureNodeId'

/**
 * Type for unserialize list item child
 *
 * @public
 */
export type UnserializedListItemChild =
  | Collection
  | CollectionBuilder
  | ChildResolver
  | Observable<ItemChild>

/**
 * Type for child of List Item
 *
 * @public
 */
export type ListItemChild = Collection | ChildResolver | Observable<ItemChild> | undefined

/**
 * Interface for serialize list item options
 *
 * @public
 */
export interface ListItemSerializeOptions extends SerializeOptions {
  /** Check if list item title is optional */
  titleIsOptional?: boolean
}

/**
 * Interface for ist item display options
 *
 * @public */
export interface ListItemDisplayOptions {
  /** Check if list item display should show icon */
  showIcon?: boolean
}

/**
 * interface for list item input
 *
 * @public */
export interface ListItemInput {
  /** List item id */
  id: string
  /** List item title */
  title?: string
  /** List item icon */
  icon?: React.ComponentType | React.ReactNode
  /** List item child */
  child?: ListItemChild
  /** List item display options */
  displayOptions?: ListItemDisplayOptions
  /** List item schema type */
  schemaType?: SchemaType | string
}

/**
 * Interface for List Item
 *
 * @public */
export interface ListItem {
  /** List item id */
  id: string
  /** List item type */
  type: string
  /** List item title */
  title?: string
  /** List item icon */
  icon?: React.ComponentType | React.ReactNode
  /** List item child */
  child?: ListItemChild
  /** List item display options */
  displayOptions?: ListItemDisplayOptions
  /** List item schema type */
  schemaType?: SchemaType
}

/**
 * Interface for unserialized list items.
 *
 * @public
 */
export interface UnserializedListItem {
  /** List item ID */
  id: string
  /** List item title */
  title: string
  /** List item icon */
  icon?: React.ComponentType | React.ReactNode
  /** List item child */
  child?: UnserializedListItemChild
  /** List item display options */
  displayOptions?: ListItemDisplayOptions
  /** List item schema */
  schemaType?: SchemaType | string
}

/**
 * Type for a partial list item
 *
 * @public */
export type PartialListItem = Partial<UnserializedListItem>

/**
 * Class for building list items.
 *
 * @public */
export class ListItemBuilder implements Serializable<ListItem> {
  protected spec: PartialListItem

  constructor(protected _context: StructureContext, spec?: ListItemInput) {
    this.spec = spec ? spec : {}
  }

  id(id: string): ListItemBuilder {
    return this.clone({id})
  }

  getId(): PartialListItem['id'] {
    return this.spec.id
  }

  title(title: string): ListItemBuilder {
    return this.clone({title, id: getStructureNodeId(title, this.spec.id)})
  }

  getTitle(): PartialListItem['title'] {
    return this.spec.title
  }

  icon(icon: React.ComponentType | React.ReactNode): ListItemBuilder {
    return this.clone({icon})
  }

  showIcon(enabled = true): ListItemBuilder {
    return this.clone({
      displayOptions: {...(this.spec.displayOptions || {}), showIcon: enabled},
    })
  }

  getShowIcon(): boolean | undefined {
    return this.spec.displayOptions ? this.spec.displayOptions.showIcon : undefined
  }

  getIcon(): PartialListItem['icon'] {
    return this.spec.icon
  }

  child(child: UnserializedListItemChild): ListItemBuilder {
    return this.clone({child})
  }

  getChild(): PartialListItem['child'] {
    return this.spec.child
  }

  schemaType(schemaType: SchemaType | string): ListItemBuilder {
    return this.clone({schemaType})
  }

  getSchemaType(): PartialListItem['schemaType'] {
    const schemaType = this.spec.schemaType

    if (typeof schemaType === 'string') {
      return this._context.schema.get(schemaType)
    }

    return this.spec.schemaType
  }

  serialize(options: ListItemSerializeOptions = {path: []}): ListItem {
    const {id, title, child} = this.spec
    if (typeof id !== 'string' || !id) {
      throw new SerializeError(
        '`id` is required for list items',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!options.titleIsOptional && (typeof title !== 'string' || !title)) {
      throw new SerializeError('`title` is required for list items', options.path, id).withHelpUrl(
        HELP_URL.TITLE_REQUIRED
      )
    }

    let schemaType = this.spec.schemaType
    if (typeof schemaType === 'string') {
      const type = this._context.schema.get(schemaType)
      if (!type) {
        throw new SerializeError(
          `Could not find type "${schemaType}" in schema`,
          options.path,
          id
        ).withHelpUrl(HELP_URL.SCHEMA_TYPE_NOT_FOUND)
      }

      schemaType = type
    }

    const serializeOptions = {path: options.path.concat(id), hint: 'child'}
    let listChild =
      child instanceof ComponentBuilder ||
      child instanceof DocumentListBuilder ||
      child instanceof DocumentBuilder ||
      child instanceof ListBuilder
        ? child.serialize(serializeOptions)
        : child

    // In the case of a function, create a bound version that will pass the correct serialize
    // context, so we may lazily resolve it at some point in the future without losing context
    if (typeof listChild === 'function') {
      const originalChild = listChild
      listChild = (itemId, childOptions) => {
        return originalChild(itemId, {...childOptions, serializeOptions})
      }
    }

    return {
      ...this.spec,
      id: validateId(id, options.path, options.index),
      schemaType,
      child: listChild,
      title,
      type: 'listItem',
    }
  }

  clone(withSpec?: PartialListItem): ListItemBuilder {
    const builder = new ListItemBuilder(this._context)
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
