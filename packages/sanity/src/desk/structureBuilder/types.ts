import type {SanityDocument, SchemaType, SortOrdering} from '@sanity/types'
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
import type {ConfigContext, Source, InitialValueTemplateItem} from 'sanity'

/**
 * Type for view
 *
 * @public
 */
export type View = FormView | ComponentView

/**
 * Type for a user view component
 *
 * @public */
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

/**
 * Type for User defined component
 *
 * @public
 */
export type UserComponent = React.ComponentType<{
  /** Component child */
  child?: ComponentBuilder
  /** Component child item ID */
  childItemId?: string
  /** Component ID */
  id: string
  /** Is component active */
  isActive?: boolean
  /** Is component selected */
  isSelected?: boolean
  /** item ID */
  itemId: string
  /** Component options */
  options?: Record<string, unknown>
  /** Pane key */
  paneKey: string
  /** URL parameters */
  urlParams: Record<string, string | undefined> | undefined
}>

/**
 * Interface for the structure builder context.
 *
 * @public
 */
export interface StructureContext extends Source {
  /** Resolve document method
   * @returns a document node builder, or null/undefined if no document node should be returned.
   */
  resolveDocumentNode: (
    /** an object holding the documentId and schemaType for the document node being resolved. */
    options: {documentId?: string; schemaType: string}
  ) => DocumentBuilder
  /** Get structure builder
   * @returns a structure builder
   */
  getStructureBuilder: () => StructureBuilder
}

/**
 * An object holding the documentId and schemaType for the document node being resolved.
 *
 * @public
 */
export interface DefaultDocumentNodeContext extends ConfigContext {
  /**
   * The id of the sanity document
   */
  documentId?: string
  /**
   * the schema of the sanity document
   */
  schemaType: string
}

/**
 * A resolver function used to return the default document node used when editing documents.
 *
 * @public
 *
 * @returns a document node builder, or null/undefined if no document node should be returned.
 *
 */
export type DefaultDocumentNodeResolver = (
  /**
   * S - an instance of the structure builder, that can be used to build the lists/items/panes for the desk tool
   * context - an object holding various context that may be used to customize the structure, for instance the current user.
   *  Defaults to
   * ```ts
   * (S) => S.defaults()
   * ```
   */
  S: StructureBuilder,
  /**
   * An object holding the documentId and schemaType for the document node being resolved.
   * {@link DefaultDocumentNodeContext}
   */
  options: DefaultDocumentNodeContext
) => DocumentBuilder | null | undefined

/**
 * Interface for the structure builder.
 *
 * @public
 */
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
