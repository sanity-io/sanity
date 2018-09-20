import {find} from 'lodash'
import {SerializePath, SerializeOptions} from './StructureNodes'
import {ChildResolverOptions, ChildResolver} from './ChildResolver'
import {SerializeError, HELP_URL} from './SerializeError'
import {ListItem, ListItemBuilder} from './ListItem'
import {
  GenericListBuilder,
  BuildableGenericList,
  GenericList,
  GenericListInput
} from './GenericList'

const getArgType = (thing: ListItem) => {
  return Array.isArray(thing) ? 'array' : typeof thing
}

const resolveChildForItem: ChildResolver = (itemId: string, options: ChildResolverOptions) => {
  const parentItem = options.parent as List
  const target = (parentItem.items.find(item => item.id === itemId) || {child: undefined}).child
  if (!target || typeof target !== 'function') {
    return target
  }

  return typeof target === 'function' ? target(itemId, options) : target
}

function maybeSerializeListItem(
  item: ListItem | ListItemBuilder,
  index: number,
  path: SerializePath
): ListItem {
  if (item instanceof ListItemBuilder) {
    return item.serialize({path, index})
  }

  const listItem = item as ListItem
  if (!listItem || listItem.type !== 'listItem') {
    const gotWhat = (listItem && listItem.type) || getArgType(listItem)
    const helpText = gotWhat === 'array' ? ' - did you forget to spread (...moreItems)?' : ''
    throw new SerializeError(
      `List items must be of type "listItem", got "${gotWhat}"${helpText}`,
      path,
      index
    ).withHelpUrl(HELP_URL.INVALID_LIST_ITEM)
  }

  return item
}

export interface List extends GenericList {
  items: ListItem[]
}

export interface ListInput extends GenericListInput {
  items?: (ListItem | ListItemBuilder)[]
}

export interface BuildableList extends BuildableGenericList {
  items?: (ListItem | ListItemBuilder)[]
}

export class ListBuilder extends GenericListBuilder<BuildableList, ListBuilder> {
  protected spec: BuildableList

  constructor(spec?: ListInput) {
    super()
    this.spec = spec ? spec : {}
  }

  items(items: (ListItemBuilder | ListItem)[]): ListBuilder {
    return this.clone({items})
  }

  getItems() {
    return this.spec.items
  }

  serialize(options: SerializeOptions = {path: []}): List {
    const id = this.spec.id
    if (typeof id !== 'string' || !id) {
      throw new SerializeError(
        '`id` is required for lists',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    const items = typeof this.spec.items === 'undefined' ? [] : this.spec.items
    if (!Array.isArray(items)) {
      throw new SerializeError(
        '`items` must be an array of items',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.LIST_ITEMS_MUST_BE_ARRAY)
    }

    const path = (options.path || []).concat(id)
    const serializedItems = items.map((item, index) => maybeSerializeListItem(item, index, path))
    const dupes = serializedItems.filter((val, i) => find(serializedItems, {id: val.id}, i + 1))

    if (dupes.length > 0) {
      const dupeIds = dupes.map(item => item.id).slice(0, 5)
      const dupeDesc = dupes.length > 5 ? `${dupeIds.join(', ')}...` : dupeIds.join(', ')
      throw new SerializeError(
        `List items with same ID found (${dupeDesc})`,
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.LIST_ITEM_IDS_MUST_BE_UNIQUE)
    }

    return {
      ...super.serialize(options),
      type: 'list',
      child: this.spec.child || resolveChildForItem,
      items: serializedItems
    }
  }

  clone(withSpec?: BuildableList) {
    const builder = new ListBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
