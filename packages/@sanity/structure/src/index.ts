import {ListBuilder, ListInput} from './List'
import {getDocumentTypeListItems} from './documentTypeListItems'
import {MenuItemBuilder, MenuItem} from './MenuItem'
import {ListItemBuilder, ListItem} from './ListItem'
import {MenuItemGroup, MenuItemGroupBuilder} from './MenuItemGroup'
import {DocumentListBuilder, DocumentListInput} from './DocumentList'
import {EditorBuilder} from './Editor'
import {EditorNode} from './StructureNodes'

const StructureBuilder = {
  list: (spec?: ListInput): ListBuilder => new ListBuilder(spec),
  listItem: (spec?: ListItem): ListItemBuilder => new ListItemBuilder(spec),
  editor: (spec?: EditorNode): EditorBuilder => new EditorBuilder(spec),
  menuItem: (spec?: MenuItem): MenuItemBuilder => new MenuItemBuilder(spec),
  menuItemGroup: (spec?: MenuItemGroup): MenuItemGroupBuilder => new MenuItemGroupBuilder(spec),
  documentList: (spec?: DocumentListInput): DocumentListBuilder => new DocumentListBuilder(spec),
  documentTypeListItems: getDocumentTypeListItems
}

export {StructureBuilder}
