import type {SanityDocument, SchemaType, SortOrdering} from '@sanity/types'
import type {ConfigContext, Source} from '../../config'
import type {InitialValueTemplateItem} from '../../templates'
import type {ComponentBuilder, ComponentInput} from './Component'
import type {DocumentBuilder, PartialDocumentNode} from './Document'
import type {DocumentListInput, DocumentListBuilder} from './DocumentList'
import type {DocumentListItemInput, DocumentListItemBuilder} from './DocumentListItem'
import type {DocumentTypeListInput} from './DocumentTypeList'
import type {InitialValueTemplateItemBuilder} from './InitialValueTemplateItem'
import type {ListBuilder, ListInput} from './List'
import type {ListItemBuilder, ListItemInput} from './ListItem'
import type {MenuItem, MenuItemBuilder} from './MenuItem'
import type {MenuItemGroup, MenuItemGroupBuilder} from './MenuItemGroup'
import type {Divider, EditorNode} from './StructureNodes'
import type {ComponentView, ComponentViewBuilder} from './views/ComponentView'
import type {FormView, FormViewBuilder} from './views/FormView'

export type View = FormView | ComponentView

export type UserViewComponent<TOptions = Record<string, any>> = React.ComponentType<{
  document: {
    draft: SanityDocument | null
    displayed: Partial<SanityDocument>
    historical: Partial<SanityDocument> | null
    published: SanityDocument | null
  }
  documentId: string
  options: TOptions
  schemaType: SchemaType
}>

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

/**
 * @internal
 */
export interface StructureContext extends Source {
  resolveDocumentNode: (options: {documentId?: string; schemaType: string}) => DocumentBuilder
  getStructureBuilder: () => StructureBuilder
}

export interface DefaultDocumentNodeContext extends ConfigContext {
  documentId?: string
  schemaType: string
}

export type DefaultDocumentNodeResolver = (
  S: StructureBuilder,
  options: DefaultDocumentNodeContext
) => DocumentBuilder | null | undefined

export interface StructureBuilder {
  /**
   * @internal
   */
  component: (spec?: ComponentInput | UserComponent) => ComponentBuilder
  defaultDocument: (options: {documentId?: string; schemaType: string}) => DocumentBuilder
  defaultInitialValueTemplateItems: () => InitialValueTemplateItemBuilder[]
  defaults: () => ListBuilder
  divider: () => Divider
  document: (spec?: PartialDocumentNode) => DocumentBuilder
  documentList: (spec?: DocumentListInput) => DocumentListBuilder
  documentListItem: (spec?: DocumentListItemInput) => DocumentListItemBuilder
  documentTypeList: (typeNameOrSpec: string | DocumentTypeListInput) => DocumentListBuilder
  documentTypeListItem: (typeName: string) => ListItemBuilder
  documentTypeListItems: () => ListItemBuilder[]
  documentWithInitialValueTemplate: (
    templateId: string,
    parameters?: Record<string, unknown>
  ) => DocumentBuilder
  editor: (spec?: EditorNode) => DocumentBuilder
  initialValueTemplateItem: (
    templateId: string,
    parameters?: Record<string, any>
  ) => InitialValueTemplateItemBuilder
  list: (spec?: ListInput) => ListBuilder
  listItem: (spec?: ListItemInput) => ListItemBuilder
  menuItem: (spec?: MenuItem) => MenuItemBuilder
  menuItemGroup: (spec?: MenuItemGroup) => MenuItemGroupBuilder
  menuItemsFromInitialValueTemplateItems: (templateItems: InitialValueTemplateItem[]) => MenuItem[]
  orderingMenuItem: (ordering: SortOrdering) => MenuItemBuilder
  orderingMenuItemsForType: (type: string) => MenuItemBuilder[]
  view: {
    form: (spec?: Partial<FormView>) => FormViewBuilder
    component: (
      componentOrSpec?: Partial<ComponentView> | React.ComponentType<any>
    ) => ComponentViewBuilder
  }
  context: StructureContext
}
