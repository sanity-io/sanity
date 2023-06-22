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
  /** By giving an object of options with documentID and its schema type receive the the respective Document builder */
  defaultDocument: (options: {documentId?: string; schemaType: string}) => DocumentBuilder
  /** Get an array of Item builders that take Initial Value template into consideration */
  defaultInitialValueTemplateItems: () => InitialValueTemplateItemBuilder[]
  /** Get the default List builder */
  defaults: () => ListBuilder
  /** Get a structure Divider */
  divider: () => Divider
  /** By giving a partial Document Node receive the respective Document Builder */
  document: (spec?: PartialDocumentNode) => DocumentBuilder
  /** By giving a Document List Input receive the respective Document List Builder */
  documentList: (spec?: DocumentListInput) => DocumentListBuilder
  /** By giving a Document List Item Input receive the respective Document List Item builder */
  documentListItem: (spec?: DocumentListItemInput) => DocumentListItemBuilder
  /** By giving a type name or Document Type List Input receive the respective Document List Builder */
  documentTypeList: (typeNameOrSpec: string | DocumentTypeListInput) => DocumentListBuilder
  /** By providing a type name receive a List Item builder */
  documentTypeListItem: (typeName: string) => ListItemBuilder
  /** Get an array of List Item builders */
  documentTypeListItems: () => ListItemBuilder[]
  /** By giving a templateID and a set of parameters receive a Document builder that takes InitialValueTemplate into account */
  documentWithInitialValueTemplate: (
    templateId: string,
    parameters?: Record<string, unknown>
  ) => DocumentBuilder
  /** By giving a Editor Node receive the respective Document Builder */
  editor: (spec?: EditorNode) => DocumentBuilder
  /** By giving a templateID and a set of parameters receive an Item Builder that takes InitialValueTemplate into account */
  initialValueTemplateItem: (
    templateId: string,
    parameters?: Record<string, any>
  ) => InitialValueTemplateItemBuilder
  /** By giving a List Input receive the respective Builder, otherwise return default ListBuilder builder */
  list: (spec?: ListInput) => ListBuilder
  /** By giving a List Item Input receive the respective Builder, otherwise return default ListItem builder */
  listItem: (spec?: ListItemInput) => ListItemBuilder
  /** By giving a Menu Item receive the respective Builder, otherwise return default MenuItem builder */
  menuItem: (spec?: MenuItem) => MenuItemBuilder
  /** By giving a Menu Item Group receive the respective Builder */
  menuItemGroup: (spec?: MenuItemGroup) => MenuItemGroupBuilder
  /** By giving an array of initial value template receive an array of Menu Items, otherwise return default MenuItem builder */
  menuItemsFromInitialValueTemplateItems: (templateItems: InitialValueTemplateItem[]) => MenuItem[]
  /** By giving a sort ordering object receive a Menu Item Builder */
  orderingMenuItem: (ordering: SortOrdering) => MenuItemBuilder
  /** By giving a type receive a list of Menu Items ordered by it */
  orderingMenuItemsForType: (type: string) => MenuItemBuilder[]
  /** View for structure */
  view: {
    form: (spec?: Partial<FormView>) => FormViewBuilder
    component: (
      componentOrSpec?: Partial<ComponentView> | React.ComponentType<any>
    ) => ComponentViewBuilder
  }
  /** Context for the structure builder
   * {@link StructureContext}
   */
  context: StructureContext
}
