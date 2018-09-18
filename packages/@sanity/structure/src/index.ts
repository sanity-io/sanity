import {ListBuilder, ListInput} from './List'
import {
  getDocumentTypeListItems,
  getDocumentTypeListItem,
  getDocumentTypeList
} from './documentTypeListItems'
import {
  MenuItemBuilder,
  MenuItem,
  getOrderingMenuItemsForSchemaType,
  getOrderingMenuItem
} from './MenuItem'
import {ListItemBuilder, ListItemInput} from './ListItem'
import {MenuItemGroup, MenuItemGroupBuilder} from './MenuItemGroup'
import {DocumentListBuilder, DocumentListInput} from './DocumentList'
import {EditorBuilder} from './Editor'
import {EditorNode} from './StructureNodes'
import {SerializeError} from './SerializeError'
import {ComponentInput, ComponentBuilder} from './Component'
import {DocumentListItemBuilder, DocumentListItemInput} from './DocumentListItem'
import {Ordering} from './Sort'

const StructureBuilder = {
  documentTypeList: getDocumentTypeList,
  documentTypeListItem: getDocumentTypeListItem,
  documentTypeListItems: getDocumentTypeListItems,

  list: (spec?: ListInput) => new ListBuilder(spec),
  listItem: (spec?: ListItemInput) => new ListItemBuilder(spec),

  menuItem: (spec?: MenuItem) => new MenuItemBuilder(spec),
  menuItemGroup: (spec?: MenuItemGroup) => new MenuItemGroupBuilder(spec),

  documentList: (spec?: DocumentListInput) => new DocumentListBuilder(spec),
  documentListItem: (spec?: DocumentListItemInput) => new DocumentListItemBuilder(spec),

  orderingMenuItem: (ordering: Ordering) => getOrderingMenuItem(ordering),
  orderingMenuItemsForType: (type: string) => getOrderingMenuItemsForSchemaType(type),

  editor: (spec?: EditorNode) => new EditorBuilder(spec),
  component: (spec?: ComponentInput | Function) => {
    return typeof spec === 'function'
      ? new ComponentBuilder().component(spec)
      : new ComponentBuilder(spec)
  }
}

export {StructureBuilder, SerializeError}
