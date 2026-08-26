import find from 'lodash-es/find.js'
import {isRecord} from 'sanity'

import {type ChildResolver, type ChildResolverOptions} from './ChildResolver'
import {type DividerBuilder} from './Divider'
import {
  type BuildableGenericList,
  type GenericList,
  GenericListBuilder,
  type GenericListInput,
  shallowIntentChecker,
} from './GenericList'
import {type IntentChecker} from './Intent'
import {type ListItem, type ListItemBuilder} from './ListItem'
import {HELP_URL, SerializeError} from './SerializeError'
import {
  type Divider,
  type Serializable,
  type SerializeOptions,
  type SerializePath,
} from './StructureNodes'
import {type StructureContext} from './types'
import {isDocumentListItem} from './util/isDocumentListItem'
import {isSerializable} from './util/isSerializable'

const getArgType = (thing: ListItem) => {
  if (thing instanceof ListBuilder) {
    return 'ListBuilder'
  }

  if (isPromise<ListItem>(thing)) {
    return 'Promise'
  }

  return Array.isArray(thing) ? 'array' : typeof thing
}

const isListItem = (item: ListItem | Divider): item is ListItem => {
  return item.type === 'listItem'
}

const defaultCanHandleIntent: IntentChecker = (intentName: string, params, context) => {
  const pane = context.pane as List
  const items = pane.items || []
  return (
    items
      .filter(isDocumentListItem)
      .some((item) => item.schemaType.name === params.type && item._id === params.id) ||
    shallowIntentChecker(intentName, params, context)
  )
}

const resolveChildForItem: ChildResolver = (itemId: string, options: ChildResolverOptions) => {
  const parentItem = options.parent as List
  const items = parentItem.items.filter(isListItem)
  const target = (items.find((item) => item.id === itemId) || {child: undefined}).child

  if (!target || typeof target !== 'function') {
    return target
  }

  return typeof target === 'function' ? target(itemId, options) : target
}

function maybeSerializeListItem(
  item: ListItem | ListItemBuilder | Divider | DividerBuilder,
  index: number,
  path: SerializePath,
): ListItem | Divider {
  if (isSerializable<ListItem | Divider>(item)) {
    // `DividerBuilder.serialize` takes no arguments, so the narrowed union cannot be called with
    // options directly; the `Serializable` interface accepts them for every builder.
    const serializable: Serializable<ListItem | Divider> = item
    return serializable.serialize({path, index})
  }

  const listItem = item as ListItem
  if (listItem && listItem.type === 'divider') {
    return item as Divider
  }

  if (!listItem || listItem.type !== 'listItem') {
    const gotWhat = (listItem && listItem.type) || getArgType(listItem)
    const helpText = gotWhat === 'array' ? ' - did you forget to spread (...moreItems)?' : ''
    throw new SerializeError(
      `List items must be of type "listItem", got "${gotWhat}"${helpText}`,
      path,
      index,
    ).withHelpUrl(HELP_URL.INVALID_LIST_ITEM)
  }

  return listItem
}

function isPromise<T>(thing: unknown): thing is PromiseLike<T> {
  return isRecord(thing) && typeof thing.then === 'function'
}

/**
 * Interface for List
 *
 * @public
 */
export interface List extends GenericList {
  type: 'list'
  /** List items. See {@link ListItem} and {@link Divider} */
  items: (ListItem | Divider)[]
}

/**
 * Interface for list input
 *
 * @public
 */
export interface ListInput extends GenericListInput {
  /** List input items array. See {@link ListItem}, {@link ListItemBuilder} and {@link Divider} */
  items?: (ListItem | ListItemBuilder | Divider | DividerBuilder)[]
}

/**
 * Interface for buildable list
 *
 * @public
 */
export interface BuildableList extends BuildableGenericList {
  /** List items. See {@link ListItem}, {@link ListItemBuilder} and {@link Divider} */
  items?: (ListItem | ListItemBuilder | Divider | DividerBuilder)[]
}

/**
 * A `ListBuilder` with the `items` method removed at the type level.
 *
 * Returned by `ListBuilder.singletons()`: calling `.items()` afterwards would
 * replace the whole items array and silently discard the singleton items, so
 * the type prevents it. Call `.items()` before `.singletons()`, or use
 * `S.listItem().singleton()` inside a regular `.items()` array, when mixing
 * singletons with other items.
 *
 * The runtime object is a plain {@link ListBuilder}; only the declared type
 * narrows. Chainable methods keep returning `SingletonListBuilder` so the
 * omission cannot be undone by further chaining.
 *
 * @public
 */
export type SingletonListBuilder = {
  [Key in keyof Omit<ListBuilder, 'items'>]: ListBuilder[Key] extends (
    ...args: infer Args
  ) => ListBuilder
    ? (...args: Args) => SingletonListBuilder
    : ListBuilder[Key]
}

/**
 * A `ListBuilder` is used to build a list of items in the structure tool.
 *
 * @public */
export class ListBuilder extends GenericListBuilder<BuildableList, ListBuilder> {
  /** buildable list option object. See {@link BuildableList} */
  protected spec: BuildableList

  protected _context: StructureContext

  constructor(
    /**
     * Structure context. See {@link StructureContext}
     */
    _context: StructureContext,
    spec?: ListInput,
  ) {
    super()
    this._context = _context
    this.spec = spec ? spec : {}
    this.initialValueTemplatesSpecified = Boolean(spec && spec.initialValueTemplates)
  }

  /**
   * Set list builder based on items provided
   * @param items - list items. See {@link ListItemBuilder}, {@link ListItem} and {@link Divider}
   * @returns list builder based on items provided. See {@link ListBuilder}
   */
  items(items: (ListItemBuilder | ListItem | Divider | DividerBuilder)[]): ListBuilder {
    return this.clone({items})
  }

  /**
   * Append a list item per singleton definition id to the list's `items`
   * array.
   *
   * Sugar for `.items(singletonIds.map((id) => S.listItem().singleton(id)))`,
   * but additive: any items previously declared via `.items(...)` are
   * preserved and the singleton items are appended. Repeated `.singletons()`
   * calls keep appending.
   *
   * Like every other `S.list()` chain, the caller must still set `.id(...)`
   * and `.title(...)` themselves; this helper does not produce a complete
   * list on its own.
   *
   * The returned builder omits the `items` method at the type level, because
   * calling `.items()` afterwards would replace the whole items array and
   * silently discard the singleton items. See {@link SingletonListBuilder}.
   *
   * Every id in `singletonIds` must refer to a registered singleton
   * definition or a `SerializeError` is thrown immediately.
   *
   * @param singletonIds - the singleton definition ids to render as list items
   * @returns list builder with the singleton list items appended
   */
  singletons(singletonIds: string[]): SingletonListBuilder {
    const builder = this._context.getStructureBuilder()
    const singletonItems = singletonIds.map((singletonId) =>
      builder.listItem().singleton(singletonId),
    )
    return this.items([...(this.spec.items ?? []), ...singletonItems])
  }

  /** Get list builder items
   * @returns list items. See {@link BuildableList}
   */
  getItems(): BuildableList['items'] {
    return this.spec.items
  }

  /** Serialize list builder
   * @param options - serialization options. See {@link SerializeOptions}
   * @returns list based on path in options. See {@link List}
   */
  serialize(options: SerializeOptions = {path: []}): List {
    const id = this.spec.id
    if (typeof id !== 'string' || !id) {
      throw new SerializeError(
        '`id` is required for lists',
        options.path,
        options.index,
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    const items = typeof this.spec.items === 'undefined' ? [] : this.spec.items
    if (!Array.isArray(items)) {
      throw new SerializeError(
        '`items` must be an array of items',
        options.path,
        options.index,
      ).withHelpUrl(HELP_URL.LIST_ITEMS_MUST_BE_ARRAY)
    }

    const path = (options.path || []).concat(id)
    const serializedItems = items.map((item, index) => maybeSerializeListItem(item, index, path))
    const dupes = serializedItems.filter((val, i) => find(serializedItems, {id: val.id}, i + 1))

    if (dupes.length > 0) {
      const dupeIds = dupes.map((item) => item.id).slice(0, 5)
      const dupeDesc = dupes.length > 5 ? `${dupeIds.join(', ')}...` : dupeIds.join(', ')
      throw new SerializeError(
        `List items with same ID found (${dupeDesc})`,
        options.path,
        options.index,
      ).withHelpUrl(HELP_URL.LIST_ITEM_IDS_MUST_BE_UNIQUE)
    }

    return {
      ...super.serialize(options),
      type: 'list',
      canHandleIntent: this.spec.canHandleIntent || defaultCanHandleIntent,
      child: this.spec.child || resolveChildForItem,
      items: serializedItems,
    }
  }

  /**
   * Clone list builder and return new list builder based on context and spec provided
   * @param withSpec - list options. See {@link BuildableList}
   * @returns new list builder based on context and spec provided. See {@link ListBuilder}
   */
  clone(withSpec?: BuildableList): ListBuilder {
    const builder = new ListBuilder(this._context)
    builder.spec = {...this.spec, ...withSpec}
    return builder
  }
}
