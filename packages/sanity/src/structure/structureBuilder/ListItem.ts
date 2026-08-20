import {type SchemaType} from '@sanity/types'
import {type Observable} from 'rxjs'
import {type I18nTextRecord} from 'sanity'

import {type ChildResolver, type ItemChild} from './ChildResolver'
import {HELP_URL, SerializeError} from './SerializeError'
import {
  type Collection,
  type CollectionBuilder,
  type Serializable,
  type SerializeOptions,
} from './StructureNodes'
import {type StructureContext} from './types'
import {isDefaultDocumentTypeChild} from './util/defaultDocumentTypeChild'
import {getStructureNodeId} from './util/getStructureNodeId'
import {isSerializable, serializableMarker} from './util/isSerializable'
import {validateId} from './util/validateId'

/**
 * Unserialized list item child.
 * See {@link Collection}, {@link CollectionBuilder}, {@link ChildResolver} and {@link ItemChild}
 *
 * @public
 */
export type UnserializedListItemChild =
  | Collection
  | CollectionBuilder
  | ChildResolver
  | Observable<ItemChild>

/**
 * Child of List Item
 * See {@link Collection}, {@link ChildResolver}, {@link ItemChild}
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
  /** Check if list item display should show a live document count */
  showCount?: boolean
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
  /** List item child. See {@link ListItemChild} */
  child?: ListItemChild
  /** List item display options. See {@link ListItemDisplayOptions} */
  displayOptions?: ListItemDisplayOptions
  /** List item schema type. See {@link SchemaType} */
  schemaType?: SchemaType | string
}

/**
 * Names the document schema type a live count covers. The count query itself is authored by the
 * Studio, so an item can only ever ask for the number of documents of one schema type.
 *
 * @public */
export interface ListItemCount {
  /** Name of the document schema type to count */
  type: string
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
  /**
   * The i18n key and namespace used to populate the localized title. This is
   * the recommend way to set the title if you are localizing your studio.
   */
  i18n?: I18nTextRecord<'title'>
  /** List item title. Note that the `i18n` key and namespace will take precedence. */
  title?: string
  /** List item icon */
  icon?: React.ComponentType | React.ReactNode
  /** List item child. See {@link ListItemChild} */
  child?: ListItemChild
  /** List item display options. See {@link ListItemDisplayOptions} */
  displayOptions?: ListItemDisplayOptions
  /** List item schema type. See {@link SchemaType} */
  schemaType?: SchemaType
  /** Document schema type to show a live count for. See {@link ListItemCount} */
  count?: ListItemCount
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
  /**
   * The i18n key and namespace used to populate the localized title. This is
   * the recommend way to set the title if you are localizing your studio.
   */
  i18n?: I18nTextRecord<'title'>
  /** List item icon */
  icon?: React.ComponentType | React.ReactNode
  /** List item child. See {@link UnserializedListItemChild} */
  child?: UnserializedListItemChild
  /** List item display options. See {@link ListItemDisplayOptions} */
  displayOptions?: ListItemDisplayOptions
  /** List item schema. See {@link SchemaType} */
  schemaType?: SchemaType | string
}

/**
 * Partial list item. See {@link UnserializedListItem}
 *
 * @public */
export type PartialListItem = Partial<UnserializedListItem>

/**
 * Class for building list items
 *
 * @public */
export class ListItemBuilder implements Serializable<ListItem> {
  /** Brand consumed by `isSerializable` (avoids circular `instanceof` imports) */
  readonly [serializableMarker] = true
  /** List item option object. See {@link PartialListItem} */
  protected spec: PartialListItem

  protected _context: StructureContext

  constructor(
    /**
     * Structure context. See {@link StructureContext}
     */
    _context: StructureContext,
    spec?: ListItemInput,
  ) {
    this._context = _context
    this.spec = spec ? spec : {}
  }

  /**
   * Set list item ID
   * @returns list item builder based on ID provided. See {@link ListItemBuilder}
   */
  id(id: string): ListItemBuilder {
    return this.clone({id})
  }

  /**
   * Get list item ID
   * @returns list item ID. See {@link PartialListItem}
   */
  getId(): PartialListItem['id'] {
    return this.spec.id
  }

  /**
   * Set list item title
   * @returns list item builder based on title provided. See {@link ListItemBuilder}
   */
  title(title: string): ListItemBuilder {
    return this.clone({title, id: getStructureNodeId(title, this.spec.id)})
  }

  /**
   * Get list item title
   * @returns list item title. See {@link PartialListItem}
   */
  getTitle(): PartialListItem['title'] {
    return this.spec.title
  }

  /** Set the i18n key and namespace used to populate the localized title.
   * @param i18n - the key and namespaced used to populate the localized title.
   * @returns component builder based on i18n key and ns provided
   */
  i18n(i18n: I18nTextRecord<'title'>): ListItemBuilder {
    return this.clone({i18n})
  }

  /** Get i18n key and namespace used to populate the localized title
   * @returns the i18n key and namespace used to populate the localized title
   */
  getI18n(): I18nTextRecord<'title'> | undefined {
    return this.spec.i18n
  }

  /**
   * Set list item icon
   * @returns list item builder based on icon provided. See {@link ListItemBuilder}
   */
  icon(icon: React.ComponentType | React.ReactNode): ListItemBuilder {
    return this.clone({icon})
  }

  /**
   * Set if list item should show icon
   * @returns list item builder based on showIcon provided. See {@link ListItemBuilder}
   */
  showIcon(enabled = true): ListItemBuilder {
    return this.clone({
      displayOptions: {...this.spec.displayOptions, showIcon: enabled},
    })
  }

  /**
   * Check if list item should show icon
   * @returns true if it should show the icon, false if not, undefined if not set
   */
  getShowIcon(): boolean | undefined {
    return this.spec.displayOptions ? this.spec.displayOptions.showIcon : undefined
  }

  /**
   * Set if list item should show a live document count.
   *
   * The badge counts every document of the item's schema type. It is withheld, with a development
   * warning, unless the item resolves a document schema type and its child is proven to list every
   * document of that type: no child, the built-in document type child, or a document list carrying
   * the default whole-type query.
   *
   * @returns list item builder based on showCount provided. See {@link ListItemBuilder}
   */
  showCount(enabled = true): ListItemBuilder {
    return this.clone({
      displayOptions: {...this.spec.displayOptions, showCount: enabled},
    })
  }

  /**
   * Check if list item should show a live document count
   * @returns true if it should show the count, false if not, undefined if not set
   */
  getShowCount(): boolean | undefined {
    return this.spec.displayOptions ? this.spec.displayOptions.showCount : undefined
  }

  /**
   *Get list item icon
   * @returns list item icon. See {@link PartialListItem}
   */
  getIcon(): PartialListItem['icon'] {
    return this.spec.icon
  }

  /**
   * Set list item child
   * @param child - list item child. See {@link UnserializedListItemChild}
   * @returns list item builder based on child provided. See {@link ListItemBuilder}
   */
  child(child: UnserializedListItemChild): ListItemBuilder {
    return this.clone({child})
  }

  /**
   * Get list item child
   * @returns list item child. See {@link PartialListItem}
   */
  getChild(): PartialListItem['child'] {
    return this.spec.child
  }

  /**
   * Set list item schema type
   * @param schemaType - list item schema type. See {@link SchemaType}
   * @returns list item builder based on schema type provided. See {@link ListItemBuilder}
   */
  schemaType(schemaType: SchemaType | string): ListItemBuilder {
    return this.clone({schemaType})
  }

  /**
   * Get list item schema type
   * @returns list item schema type. See {@link PartialListItem}
   */
  getSchemaType(): PartialListItem['schemaType'] {
    const schemaType = this.spec.schemaType

    if (typeof schemaType === 'string') {
      return this._context.schema.get(schemaType)
    }

    return this.spec.schemaType
  }

  /** Serialize list item builder
   * @param options - serialization options. See {@link ListItemSerializeOptions}
   * @returns list item node based on path provided in options. See {@link ListItem}
   */
  serialize(options: ListItemSerializeOptions = {path: []}): ListItem {
    const {id, title, child} = this.spec
    if (typeof id !== 'string' || !id) {
      throw new SerializeError(
        '`id` is required for list items',
        options.path,
        options.index,
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!options.titleIsOptional && (typeof title !== 'string' || !title)) {
      throw new SerializeError('`title` is required for list items', options.path, id).withHelpUrl(
        HELP_URL.TITLE_REQUIRED,
      )
    }

    let schemaType = this.spec.schemaType
    if (typeof schemaType === 'string') {
      const type = this._context.schema.get(schemaType)
      if (!type) {
        throw new SerializeError(
          `Could not find type "${schemaType}" in schema`,
          options.path,
          id,
        ).withHelpUrl(HELP_URL.SCHEMA_TYPE_NOT_FOUND)
      }

      schemaType = type
    }

    const serializeOptions = {path: options.path.concat(id), hint: 'child'}
    let listChild = isSerializable<Collection>(child) ? child.serialize(serializeOptions) : child

    // In the case of a function, create a bound version that will pass the correct serialize
    // context, so we may lazily resolve it at some point in the future without losing context
    if (typeof listChild === 'function') {
      const originalChild = listChild
      listChild = (itemId, childOptions) => {
        return originalChild(itemId, {...childOptions, serializeOptions})
      }
    }

    const count = this.spec.displayOptions?.showCount
      ? resolveListItemCount(child, schemaType, id)
      : undefined

    return {
      ...this.spec,
      id: validateId(id, options.path, options.index),
      schemaType,
      child: listChild,
      title,
      type: 'listItem',
      count,
    }
  }

  /** Clone list item builder
   * @param withSpec - partial list item options. See {@link PartialListItem}
   * @returns list item builder based on context and spec provided. See {@link ListItemBuilder}
   */
  clone(withSpec?: PartialListItem): ListItemBuilder {
    const builder = new ListItemBuilder(this._context)
    builder.spec = {...this.spec, ...withSpec}
    return builder
  }
}

const DEFAULT_DOCUMENT_TYPE_FILTER = '_type == $type'
const COUNT_COVERS_WHOLE_TYPE = 'a count only ever covers a whole document type'

function warnCountWithheld(id: string, reason: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[structure] showCount() ignored for list item "${id}": ${reason}`)
  }
}

interface DocumentListShapedChild {
  getFilter(): string | undefined
  getParams(): Record<string, unknown> | undefined
}

function isDocumentListShapedChild(child: unknown): child is DocumentListShapedChild {
  if (isSerializable(child)) {
    const candidate = child as Partial<DocumentListShapedChild>
    return typeof candidate.getFilter === 'function' && typeof candidate.getParams === 'function'
  }

  return false
}

function hasDefaultDocumentTypeQuery(child: DocumentListShapedChild, typeName: string): boolean {
  const params = child.getParams() ?? {}

  return (
    child.getFilter() === DEFAULT_DOCUMENT_TYPE_FILTER &&
    Object.keys(params).length === 1 &&
    params.type === typeName
  )
}

/**
 * Emits a count descriptor only for a child proven to list every document of the item's schema type:
 * no child, the built-in document type child, or a document list carrying the default whole-type
 * query. Any other child withholds the count, so a badge never contradicts the list it sits on.
 */
function resolveListItemCount(
  child: PartialListItem['child'],
  schemaType: SchemaType | undefined,
  id: string,
): ListItemCount | undefined {
  if (schemaType === undefined) {
    warnCountWithheld(id, 'it resolves no document type to count')
    return undefined
  }

  const count: ListItemCount = {type: schemaType.name}

  if (child === undefined || isDefaultDocumentTypeChild(child)) {
    return count
  }

  if (isDocumentListShapedChild(child)) {
    if (hasDefaultDocumentTypeQuery(child, schemaType.name)) {
      return count
    }

    warnCountWithheld(id, `its child document list is filtered, and ${COUNT_COVERS_WHOLE_TYPE}`)
    return undefined
  }

  warnCountWithheld(
    id,
    `its child cannot be inspected at serialize time, and ${COUNT_COVERS_WHOLE_TYPE}`,
  )
  return undefined
}
