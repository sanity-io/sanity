import {SortOrdering} from '@sanity/types'
import {ChildResolverContext, ChildResolverOptions} from './ChildResolver'
import {ComponentBuilder, ComponentInput} from './Component'
import {DocumentBuilder, PartialDocumentNode} from './Document'
import {DocumentListBuilder, DocumentListInput} from './DocumentList'
import {DocumentListItemBuilder, DocumentListItemInput} from './DocumentListItem'
import {DocumentTypeListInput} from './DocumentTypeList'
import {InitialValueTemplateItem, InitialValueTemplateItemBuilder} from './InitialValueTemplateItem'
import {ListBuilder, ListInput} from './List'
import {ListItemBuilder, ListItemInput} from './ListItem'
import {MenuItem, MenuItemBuilder} from './MenuItem'
import {MenuItemGroup, MenuItemGroupBuilder} from './MenuItemGroup'
import {Divider, EditorNode} from './StructureNodes'
import {ComponentView, ComponentViewBuilder} from './views/ComponentView'
import {FormViewBuilder} from './views/FormView'
import {View} from './views/View'

export type UserComponent = React.ComponentType<{
  child?: ComponentBuilder
  childItemId?: string
  id: string
  isActive?: boolean
  isSelected?: boolean
  itemId: string
  options?: Record<string, unknown>
  paneKey: string
  urlParams: Record<string, string | undefined> | undefined
}>

export interface DocumentNodeResolver {
  (
    S: StructureBuilder,
    options: {
      documentId?: string
      schemaType: string
    }
  ): DocumentBuilder | null
}

// prettier-ignore
export interface StructureBuilder {
  /**
   * @internal
   */
  readonly _resolverContext: ChildResolverContext
  component: (spec?: ComponentInput | UserComponent) => ComponentBuilder
  defaultDocument: (options: {documentId?: string, schemaType: string}) => DocumentBuilder
  defaultInitialValueTemplateItems: () => InitialValueTemplateItemBuilder[]
  defaults: () => ListBuilder
  divider: () => Divider
  document: (spec?: PartialDocumentNode) => DocumentBuilder
  documentList: (spec?: DocumentListInput) => DocumentListBuilder
  documentListItem: (spec?: DocumentListItemInput) => DocumentListItemBuilder
  documentTypeList: (typeNameOrSpec: string | DocumentTypeListInput) => DocumentListBuilder
  documentTypeListItem: (typeName: string) => ListItemBuilder
  documentTypeListItems: () => ListItemBuilder[]
  documentWithInitialValueTemplate: (templateId: string, parameters: ChildResolverOptions) => DocumentBuilder
  editor: (spec?: EditorNode) => DocumentBuilder
  initialValueTemplateItem: (templateId: string, parameters?: Record<string, any>) => InitialValueTemplateItemBuilder
  list: (spec?: ListInput) => ListBuilder
  listItem: (spec?: ListItemInput) => ListItemBuilder
  menuItem: (spec?: MenuItem) => MenuItemBuilder
  menuItemGroup: (spec?: MenuItemGroup) => MenuItemGroupBuilder
  menuItemsFromInitialValueTemplateItems: (templateItems: InitialValueTemplateItem[]) => MenuItem[]
  orderingMenuItem: (ordering: SortOrdering) => MenuItemBuilder
  orderingMenuItemsForType: (type: string) => MenuItemBuilder[]
  view: {
    form: (spec?: Partial<View>) => FormViewBuilder,
    component: (componentOrSpec?: Partial<ComponentView> | React.ComponentType<any>) => ComponentViewBuilder
  }
}
