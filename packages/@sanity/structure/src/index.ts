import {ListBuilder, PartialList} from './List'
import {getDocumentTypeListItems} from './documentTypeListItems'
import {PartialMenuItem, MenuItemBuilder} from './MenuItem'
import {ListItemBuilder, UnserializedListItem} from './ListItem'
import {MenuItemGroup, MenuItemGroupBuilder} from './MenuItemGroup'
import {PartialDocumentList, DocumentListBuilder} from './DocumentList'
import {EditorBuilder, PartialEditorNode} from './Editor'

const StructureBuilder = {
  list: (spec?: PartialList): ListBuilder => new ListBuilder(spec),
  listItem: (spec?: UnserializedListItem): ListItemBuilder => new ListItemBuilder(spec),
  editor: (spec?: PartialEditorNode): EditorBuilder => new EditorBuilder(spec),
  menuItem: (spec?: PartialMenuItem): MenuItemBuilder => new MenuItemBuilder(spec),
  menuItemGroup: (spec?: MenuItemGroup): MenuItemGroupBuilder => new MenuItemGroupBuilder(spec),
  documentList: (spec?: PartialDocumentList): DocumentListBuilder => new DocumentListBuilder(spec),
  documentTypeListItems: getDocumentTypeListItems
}

export {StructureBuilder}
