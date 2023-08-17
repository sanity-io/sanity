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
 * View. See {@link FormView} and {@link ComponentView}
 *
 * @public
 */
export type View = FormView | ComponentView

/**
 * User view component
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
 * User defined component
 *
 * @public
 */
export type UserComponent = React.ComponentType<{
  /** Component child. See {@link ComponentBuilder} */
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
   * See {@link DocumentBuilder}
   */
  resolveDocumentNode: (
    /** an object holding the documentId and schemaType for the document node being resolved. */
    options: {documentId?: string; schemaType: string},
  ) => DocumentBuilder
  /** Get structure builder
   * @returns a structure builder. See {@link StructureBuilder}
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
   * See {@link StructureBuilder}
   */
  S: StructureBuilder,
  /**
   * An object holding the documentId and schemaType for the document node being resolved.
   * See {@link DefaultDocumentNodeContext}
   */
  options: DefaultDocumentNodeContext,
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
  /** By giving an object of options with documentID and its schema type receive the the respective Document builder
   * @param options - an object holding the documentId and schemaType for the document node being resolved.
   * @returns a Document builder. See {@link DocumentBuilder}
   */
  defaultDocument: (options: {documentId?: string; schemaType: string}) => DocumentBuilder
  /** Get an array of Item builders that take Initial Value template into consideration
   * @returns an array of initial value template item builders. See {@link ListItemBuilder}
   */
  defaultInitialValueTemplateItems: () => InitialValueTemplateItemBuilder[]
  /** Get the default List builder
   * @returns a List builder. See {@link ListBuilder}
   */
  defaults: () => ListBuilder
  /** Get a structure Divider
   * @returns a Divider. See {@link Divider}
   */
  divider: () => Divider
  /** By giving a partial Document Node receive the respective Document Builder
   * @param spec - a partial document node. See {@link PartialDocumentNode}
   * @returns a Document builder. See {@link DocumentBuilder}
   */
  document: (spec?: PartialDocumentNode) => DocumentBuilder
  /** By giving a Document List Input receive the respective Document List Builder
   * @param spec - a document list input. See {@link DocumentListInput}
   * @returns a Document List builder. See {@link DocumentListBuilder}
   */
  documentList: (spec?: DocumentListInput) => DocumentListBuilder
  /** By giving a Document List Item Input receive the respective Document List Item builder
   * @param spec - a document list item input. See {@link DocumentListItemInput}
   * @returns a Document List Item builder. See {@link DocumentListItemBuilder}
   */
  documentListItem: (spec?: DocumentListItemInput) => DocumentListItemBuilder
  /** By giving a type name or Document Type List Input receive the respective Document List Builder
   * @param typeNameOrSpec - a type name or a document type list input. See {@link DocumentTypeListInput}
   * @returns a Document List builder. See {@link DocumentListBuilder}
   */
  documentTypeList: (typeNameOrSpec: string | DocumentTypeListInput) => DocumentListBuilder
  /** By providing a type name receive a List Item builder
   * @param typeName - a type name
   * @returns a List Item builder. See {@link ListItemBuilder}
   */
  documentTypeListItem: (typeName: string) => ListItemBuilder
  /** Get an array of List Item builders
   * @returns an array of list item builders. See {@link ListItemBuilder}
   */
  documentTypeListItems: () => ListItemBuilder[]
  /** By giving a templateID and a set of parameters receive a Document builder that takes InitialValueTemplate into account
   * @param templateId - a template ID
   * @param parameters - an object of parameters
   * @returns a Document builder. See {@link DocumentBuilder}
   */
  documentWithInitialValueTemplate: (
    templateId: string,
    parameters?: Record<string, unknown>,
  ) => DocumentBuilder
  /** By giving a Editor Node receive the respective Document Builder
   * @param spec - an editor node. See {@link EditorNode}
   * @returns a Document builder. See {@link DocumentBuilder}
   */
  editor: (spec?: EditorNode) => DocumentBuilder
  /** By giving a templateID and a set of parameters receive an Item Builder that takes InitialValueTemplate into account
   * @param templateId - a template ID
   * @param parameters - an object of parameters
   * @returns an Item builder. See {@link ListItemBuilder}
   */
  initialValueTemplateItem: (
    templateId: string,
    parameters?: Record<string, any>,
  ) => InitialValueTemplateItemBuilder
  /** By giving a List Input receive the respective Builder, otherwise return default ListBuilder builder
   * @param spec - a list input. See {@link ListInput}
   * @returns a List builder. See {@link ListBuilder}
   */
  list: (spec?: ListInput) => ListBuilder
  /** By giving a List Item Input receive the respective Builder, otherwise return default ListItem builder
   * @param spec - a list item input. See {@link ListItemInput}
   * @returns a List Item builder. See {@link ListItemBuilder}
   */
  listItem: (spec?: ListItemInput) => ListItemBuilder
  /** By giving a Menu Item receive the respective Builder, otherwise return default MenuItem builder
   * @param spec - a menu item. See {@link MenuItem}
   * @returns a Menu Item builder. See {@link MenuItemBuilder}
   */
  menuItem: (spec?: MenuItem) => MenuItemBuilder
  /** By giving a Menu Item Group receive the respective Builder
   * @param spec - a menu item group. See {@link MenuItemGroup}
   * @returns a Menu Item Group builder. See {@link MenuItemGroupBuilder}
   */
  menuItemGroup: (spec?: MenuItemGroup) => MenuItemGroupBuilder
  /** By giving an array of initial value template receive an array of Menu Items, otherwise return default MenuItem builder
   * @param templateItems - an array of initial value template items. See {@link InitialValueTemplateItem}
   * @returns an array of Menu Items. See {@link MenuItem}
   */
  menuItemsFromInitialValueTemplateItems: (templateItems: InitialValueTemplateItem[]) => MenuItem[]
  /** By giving a sort ordering object receive a Menu Item Builder
   * @param ordering - a sort ordering object. See {@link SortOrdering}
   * @returns a Menu Item builder. See {@link MenuItemBuilder}
   */
  orderingMenuItem: (ordering: SortOrdering) => MenuItemBuilder
  /** By giving a type receive a list of Menu Items ordered by it
   * @param type - a type
   * @returns an array of Menu Items. See {@link MenuItem}
   */
  orderingMenuItemsForType: (type: string) => MenuItemBuilder[]
  /** View for structure */
  view: {
    /** form for view
     * @param spec - a partial form view. See {@link FormView}
     * @returns a Form View builder. See {@link FormViewBuilder}
     */
    form: (spec?: Partial<FormView>) => FormViewBuilder
    /** component for view
     * @param componentOrSpec - a partial component view or a React component. See {@link ComponentView}
     * @returns a Component View builder. See {@link ComponentViewBuilder}
     */
    component: (
      componentOrSpec?: Partial<ComponentView> | React.ComponentType<any>,
    ) => ComponentViewBuilder
  }
  /** Context for the structure builder. See {@link StructureContext} */
  context: StructureContext
}
