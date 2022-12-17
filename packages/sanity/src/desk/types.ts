import {SchemaType} from '@sanity/types'
import {InteropObservable, Observable, ObservableInput, Subscribable} from 'rxjs'
import {
  DefaultDocumentNodeResolver,
  StructureBuilder,
  StructureContext,
  UserComponent,
  View,
} from './structureBuilder'
import {
  GeneralPreviewLayoutKey,
  ConfigContext,
  InitialValueTemplateItem,
  DocumentStore,
} from 'sanity'

/** @internal */
export interface DeskToolFeatures {
  /**
   * @beta
   */
  backButton: boolean
  reviewChanges: boolean
  splitPanes: boolean
  splitViews: boolean
}

/** @internal */
export interface DeskToolContextValue {
  features: DeskToolFeatures
  layoutCollapsed: boolean
  setLayoutCollapsed: (layoutCollapsed: boolean) => void

  rootPaneNode: UnresolvedPaneNode
  structureContext: StructureContext
}

/** @public */
export interface StructureResolverContext extends ConfigContext {
  /**
   * This can be replaced by a different API in the future.
   * It is provided as-is to support common structure patterns found in V2 in V3.
   * @alpha
   * */
  documentStore: DocumentStore
}

/** @beta */
// TODO: this should be updated to enforce the correct return type
export type StructureResolver = (S: StructureBuilder, context: StructureResolverContext) => unknown

/** @internal */
export type DeskToolPaneActionHandler = (params: any, scope?: unknown) => void

/** @beta */
export interface DeskToolOptions {
  icon?: React.ComponentType
  name?: string
  source?: string
  structure?: StructureResolver
  defaultDocumentNode?: DefaultDocumentNodeResolver
  title?: string
}

/**
 * Represents the state of the `panes` inside the desk-tool router
 *
 * - The desk tool stores the state of the current panes inside of the router.
 * - The panes are stored in groups delimited in the URL by `;`.
 * - In each group, there can be one or more sibling (aka split) panes delimited
 *   by `|`.
 * - Each item pane can contain it's own parameters and payloads
 * - Per item pane in each group, if not specified separately, the ID, params,
 *   and payload will be inherited from the first item pane in the pane group
 *   (unless it's an `exclusiveParam`)
 *
 * E.g. `/desk/books;book-123|,view=preview` will parse to:
 *
 * ```js
 * [
 *   // first pane group
 *   [{id: 'book'}],
 *
 *   // second pane group
 *   [
 *     [
 *       // first pane item
 *       {id: 'book-123'},
 *       // second pane item
 *       {id: 'book-123', params: {view: 'preview'}},
 *     ],
 *   ],
 * ]
 * ```
 *
 * see [`packages/@sanity/desk-tool/src/utils/parsePanesSegment.ts`][0]
 *
 * [0]: https://github.com/sanity-io/sanity/blob/287d308442938c98cbec4608d159401631792d7a/packages/%40sanity/desk-tool/src/utils/parsePanesSegment.ts#L71-L88
 *
 * @beta
 */
export type RouterPanes = RouterPaneGroup[]

/**
 * Represents a "pane group" in the router.
 *
 * @see RouterPanes
 *
 * @beta
 */
export type RouterPaneGroup = RouterPaneSibling[]

/**
 * Represents a "sibling pane" or "split pane" in the router.
 *
 * @see RouterPanes
 *
 * @beta
 */
export interface RouterPaneSibling {
  id: string
  params?: Record<string, string | undefined>
  payload?: unknown
}

// TODO: unify this with the structure builder ChildResolver type
/**
 * Passed as the second argument to the item of resolving pane children
 *
 * @see RouterPanes
 *
 * @internal
 */
export interface RouterPaneSiblingContext {
  id: string
  parent: PaneNode | null
  index: number
  splitIndex: number
  path: string[]
  params: Record<string, string | undefined>
  payload: unknown
  structureContext: StructureContext
  // used in structure builder
  serializeOptions?: {
    path: (string | number)[]
    index?: number
    hint?: string
  }
}

/** @internal */
export type DeskToolMenuItem = ReturnType<ReturnType<StructureBuilder['menuItem']>['serialize']>

/**
 * Represents what can be passed into `menuItems` inside of desk-tool panes
 *
 * @see BaseResolvedPaneNode
 *
 * @internal
 */
export interface PaneMenuItem extends DeskToolMenuItem {
  // TODO: these would be great options in the `MenuItemBuilder`
  // currently, they are only used in the `DocumentPaneProvider`
  isDisabled?: boolean
  shortcut?: string
}

/** @internal */
export interface PaneMenuItemGroup {
  id: string
  title?: string
}

/** @internal */
export interface BaseResolvedPaneNode<T extends PaneNode['type']> {
  id: string
  type: T
  title: string
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  canHandleIntent?: (
    intentName: string,
    params: Record<string, string | undefined>,
    options: {pane: PaneNode; index: number}
  ) => boolean
  child?: UnresolvedPaneNode
}

/** @internal */
export interface CustomComponentPaneNode extends BaseResolvedPaneNode<'component'> {
  component: UserComponent
  options?: Record<string, unknown>
  // component: React.ComponentType<Props> | React.ReactNode
}

/** @internal */
export interface DocumentPaneNode extends BaseResolvedPaneNode<'document'> {
  options: {
    id: string
    type: string
    template?: string
    templateParameters?: Record<string, unknown>
  }
  source?: string
  views?: View[]
}

/** @internal */
export interface DocumentListPaneNode extends BaseResolvedPaneNode<'documentList'> {
  defaultLayout?: GeneralPreviewLayoutKey
  displayOptions?: {showIcons?: boolean}
  initialValueTemplates?: InitialValueTemplateItem[]
  options: {
    filter: string
    defaultOrdering?: Array<{field: string; direction: 'asc' | 'desc'}>
    params?: Record<string, unknown>
    apiVersion?: string
  }
  schemaTypeName: string
  source?: string
}

/** @internal */
export interface PaneListItem<TParams = unknown> {
  type: 'listItem'
  id: string

  // these are specific to `DocumentListItem`
  _id?: string
  schemaType?: SchemaType

  title: string
  icon?: React.ComponentType | false
  displayOptions?: {showIcon?: boolean}
  action?: (t: TParams) => unknown
  params?: TParams
}

/** @internal */
export interface PaneListItemDivider {
  type: 'divider'
}

/** @internal */
export interface ListPaneNode extends BaseResolvedPaneNode<'list'> {
  defaultLayout?: GeneralPreviewLayoutKey
  displayOptions?: {showIcons?: boolean}
  items?: Array<PaneListItem | PaneListItemDivider>
  // TODO: mark as unstable or remove
  source?: string
}

/** @internal */
export type PaneNode =
  | CustomComponentPaneNode
  | DocumentPaneNode
  | DocumentListPaneNode
  | ListPaneNode

/** @internal */
export type SerializablePaneNode = {
  // TODO: unify this context with `SerializeOptions`
  serialize(context: RouterPaneSiblingContext): UnresolvedPaneNode
}

/** @internal */
export type PaneNodeResolver = (id: string, context: RouterPaneSiblingContext) => UnresolvedPaneNode

// TODO: these types need to be unified with the buidlers `ListBuilder
/** @internal */
export type UnresolvedPaneNode =
  | PaneNodeResolver
  | SerializablePaneNode
  | Observable<UnresolvedPaneNode>
  | PromiseLike<UnresolvedPaneNode>
  | PaneNode
