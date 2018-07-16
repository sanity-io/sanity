import {SerializePath, SerializeOptions, Collection, CollectionBuilder} from './StructureNodes'
import {ChildResolverOptions, ChildResolver, ItemChild} from './ChildResolver'
import {SerializeError, HELP_URL} from './SerializeError'
import {ListItem, ListItemBuilder} from './ListItem'
import {
  GenericListBuilder,
  BuildableGenericList,
  GenericList,
  GenericListInput
} from './GenericList'

const resolveChildForItem: ChildResolver = (
  itemId: string,
  parent: Collection,
  options: ChildResolverOptions
): ItemChild | Promise<ItemChild> | undefined => {
  const parentItem = parent as List
  const target = (parentItem.items.find(item => item.id === itemId) || {child: undefined}).child
  if (!target || typeof target !== 'function') {
    return target
  }

  const child = typeof target === 'function' ? target(itemId, parentItem, options) : target

  return Promise.resolve(child).then(itemChild => {
    const childBuilder = itemChild as CollectionBuilder
    return childBuilder && typeof childBuilder.serialize === 'function'
      ? childBuilder.serialize({
          path: options.parentPath || [],
          index: options.index,
          hint: 'childResolver'
        })
      : itemChild
  })
}

function maybeSerializeListItem(
  item: ListItem | ListItemBuilder,
  index: number,
  path: SerializePath
): ListItem {
  return item instanceof ListItemBuilder ? item.serialize({path, index}) : item
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

export class ListBuilder extends GenericListBuilder<BuildableList> {
  protected spec: BuildableList

  constructor(spec?: ListInput) {
    super()
    this.spec = spec ? spec : {}
  }

  items(items: (ListItemBuilder | ListItem)[]): ListBuilder {
    this.spec.items = items
    return this
  }

  serialize(options: SerializeOptions = {path: []}): List {
    const {id, items} = this.spec
    if (typeof id !== 'string' || !id) {
      throw new SerializeError(
        '`id` is required for lists',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    const path = options.path.concat(id)
    return {
      ...super.serialize(options),
      type: 'list',
      resolveChildForItem: this.spec.resolveChildForItem || resolveChildForItem,
      items: (items || []).map((item, index) => maybeSerializeListItem(item, index, path))
    }
  }
}
