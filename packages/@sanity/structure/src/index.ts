import {uniqueId} from 'lodash'
import {SchemaType} from './parts/Schema'
import {ListBuilder, ListInput} from './List'
import {
  getDocumentTypeListItems,
  getDocumentTypeListItem,
  getDocumentTypeList,
} from './documentTypeListItems'
import {
  MenuItemBuilder,
  MenuItem,
  getOrderingMenuItemsForSchemaType,
  getOrderingMenuItem,
} from './MenuItem'
import {ListItemBuilder, ListItemInput} from './ListItem'
import {MenuItemGroup, MenuItemGroupBuilder} from './MenuItemGroup'
import {DocumentListBuilder, DocumentListInput} from './DocumentList'
import {Divider} from './StructureNodes'
import {SerializeError} from './SerializeError'
import {
  DocumentBuilder,
  PartialDocumentNode,
  documentFromEditor,
  documentFromEditorWithInitialValue,
  getDefaultDocumentNode,
} from './Document'
import {ComponentInput, ComponentBuilder} from './Component'
import {DocumentListItemBuilder, DocumentListItemInput} from './DocumentListItem'
import {Ordering} from './Sort'
import * as views from './views'
import {
  InitialValueTemplateItemBuilder,
  defaultInitialValueTemplateItems,
  menuItemsFromInitialValueTemplateItems,
} from './InitialValueTemplateItem'

const StructureBuilder = {
  defaults: getDefaultStructure,
  documentTypeList: getDocumentTypeList,
  documentTypeListItem: getDocumentTypeListItem,
  documentTypeListItems: getDocumentTypeListItems,
  document: (spec?: PartialDocumentNode) => new DocumentBuilder(spec),
  documentWithInitialValueTemplate: documentFromEditorWithInitialValue,
  defaultDocument: getDefaultDocumentNode,

  list: (spec?: ListInput) => new ListBuilder(spec),
  listItem: (spec?: ListItemInput) => new ListItemBuilder(spec),

  menuItem: (spec?: MenuItem) => new MenuItemBuilder(spec),
  menuItemGroup: (spec?: MenuItemGroup) => new MenuItemGroupBuilder(spec),
  menuItemsFromInitialValueTemplateItems,

  documentList: (spec?: DocumentListInput) => new DocumentListBuilder(spec),
  documentListItem: (spec?: DocumentListItemInput) => new DocumentListItemBuilder(spec),

  orderingMenuItem: (ordering: Ordering) => getOrderingMenuItem(ordering),
  orderingMenuItemsForType: (type: string) => getOrderingMenuItemsForSchemaType(type),

  editor: documentFromEditor,
  editorWithInitialValueTemplate: documentFromEditorWithInitialValue,

  defaultInitialValueTemplateItems,
  initialValueTemplateItem: (
    templateId: string,
    parameters?: {[key: string]: any}
  ): InitialValueTemplateItemBuilder =>
    new InitialValueTemplateItemBuilder({
      id: templateId,
      parameters,
      templateId,
    }),

  component: (spec?: ComponentInput | Function) => {
    return typeof spec === 'function'
      ? new ComponentBuilder().component(spec)
      : new ComponentBuilder(spec)
  },

  divider: (): Divider => ({id: uniqueId('__divider__'), type: 'divider'}),

  view: views,
}

function hasIcon(schemaType?: SchemaType | string): boolean {
  if (!schemaType || typeof schemaType === 'string') {
    return false
  }

  return Boolean(schemaType.icon)
}

function getDefaultStructure(): ListBuilder {
  const items = getDocumentTypeListItems()
  return new ListBuilder()
    .id('__root__')
    .title('Content')
    .items(items)
    .showIcons(items.some((item) => hasIcon(item.getSchemaType())))
}

export type {InitialValueTemplateItem} from './InitialValueTemplateItem'

export {StructureBuilder, SerializeError}
