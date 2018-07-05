import {StructureNode} from './StructureNodes'
import {ChildResolverOptions, ChildResolver} from './ChildResolver'
import {ListItem, ListItemBuilder} from './ListItem'
import {GenericListBuilder, PartialGenericList, GenericList} from './GenericList'

const resolveChildForItem: ChildResolver = (
  itemId: string,
  parent: StructureNode,
  options: ChildResolverOptions
): StructureNode | Promise<StructureNode> | undefined => {
  const parentItem = parent as List
  const target = parentItem.items.find(item => item.id === itemId)
  const child = target && target.child
  return typeof child === 'function' ? child(itemId, parentItem, options) : child
}

function maybeSerializeListItem(item: ListItem | ListItemBuilder): ListItem {
  return item instanceof ListItemBuilder ? item.serialize() : item
}

interface List extends GenericList {
  items: ListItem[]
}

export interface PartialList extends PartialGenericList {
  items?: (ListItem | ListItemBuilder)[]
}

export class ListBuilder extends GenericListBuilder<PartialList> {
  constructor(spec: PartialList = {}) {
    super(spec)
  }

  items(items: (ListItemBuilder | ListItem)[]): ListBuilder {
    this.spec.items = items.map(maybeSerializeListItem)
    return this
  }

  serialize(): List {
    const {id, items} = this.spec
    if (typeof id !== 'string' || !id) {
      throw new Error('`id` is required for lists')
    }

    return {
      ...super.serialize(),
      type: 'list',
      resolveChildForItem: this.spec.resolveChildForItem || resolveChildForItem,
      items: (items || []).map(maybeSerializeListItem)
    }
  }
}
