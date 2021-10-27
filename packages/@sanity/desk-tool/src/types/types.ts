import {Subscribable} from 'rxjs'
import {SchemaType, SanityDocument} from '@sanity/types'
import {InitialValueTemplateItem, StructureBuilder} from '@sanity/structure'

export interface PreviewValue {
  id?: string
  subtitle?: React.ReactNode
  title?: React.ReactNode
  media?: React.ReactNode | React.ComponentType
  icon?: boolean
  type?: string
  displayOptions?: {showIcon?: boolean}
  schemaType?: {name?: string}
}

export type DeskToolPaneActionHandler = (params: any, scope?: unknown) => void

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
 */
export type RouterPanes = RouterPaneGroup[]

/**
 * Represents a "pane group" in the router.
 *
 * @see RouterPanes
 */
export type RouterPaneGroup = RouterPaneSibling[]

/**
 * Represents a "sibling pane" or "split pane" in the router.
 *
 * @see RouterPanes
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
 */
export interface RouterPaneSiblingContext {
  id: string
  parent: PaneNode | null
  index: number
  splitIndex: number
  path: string[]
  params: Record<string, string | undefined>
  payload: unknown
  // used in structure builder
  serializeOptions?: {
    path: (string | number)[]
    index?: number
    hint?: string
  }
}

type MenuItem = ReturnType<ReturnType<typeof StructureBuilder.menuItem>['serialize']>

/**
 * Represents what can be passed into `menuItems` inside of desk-tool panes
 *
 * @see BaseResolvedPaneNode
 */
export interface PaneMenuItem extends MenuItem {
  // TODO: these would be great options in the `MenuItemBuilder`
  // currently, they are only used in the `DocumentPaneProvider`
  isDisabled?: boolean
  shortcut?: string
}

export interface PaneMenuItemGroup {
  id: string
  title?: string
}

interface BaseResolvedPaneNode<T extends PaneNode['type']> {
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

export interface CustomComponentPaneNode<
  // NOTE: other params from this pane value will be pass as props to the
  // component (thus the generic param)
  Props extends CustomComponentPaneNodeProps = CustomComponentPaneNodeProps
> extends BaseResolvedPaneNode<'component'> {
  component: React.ComponentType<Props> | React.ReactNode
}

export interface CustomComponentPaneNodeProps {
  id: string
  childItemId: string
  itemId: string
  paneKey: string
  urlParams: Record<string, string>
  isActive: boolean
  isSelected: boolean
}

export type PaneView<TOptions = unknown> =
  | {
      id: string
      type: 'form'
      title: string
      icon?: React.ComponentType
    }
  | {
      id: string
      type: 'component'
      title: string
      icon?: React.ComponentType
      options?: TOptions
      component?: React.ComponentType<{
        documentId: string
        options?: TOptions
        schemaType: SchemaType
        document: {
          draft: SanityDocument | null
          displayed: Partial<SanityDocument>
          historical: Partial<SanityDocument> | null
          published: SanityDocument | null
        }
      }>
    }

export interface DocumentPaneNode extends BaseResolvedPaneNode<'document'> {
  options: {
    id: string
    type: string
    template?: string
    templateParameters?: Record<string, unknown>
  }
  views?: PaneView[]
}

export interface DocumentListPaneNode extends BaseResolvedPaneNode<'documentList'> {
  defaultLayout?: 'default' | 'detail' | 'card' | 'media'
  displayOptions?: {showIcons?: boolean}
  initialValueTemplates?: InitialValueTemplateItem[]
  options: {
    filter: string
    defaultOrdering?: Array<{field: string; direction: 'asc' | 'desc'}>
    params?: Record<string, unknown>
  }
  schemaTypeName: string
}

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

export interface PaneListItemDivider {
  type: 'divider'
}

export interface ListPaneNode extends BaseResolvedPaneNode<'list'> {
  defaultLayout?: 'inline' | 'block' | 'default' | 'card' | 'media' | 'detail'
  displayOptions?: {showIcons?: boolean}
  items?: Array<PaneListItem | PaneListItemDivider>
}

export type PaneNode =
  | CustomComponentPaneNode
  | DocumentPaneNode
  | DocumentListPaneNode
  | ListPaneNode

export type SerializablePaneNode = {
  // TODO: unify this context with `SerializeOptions`
  serialize(context: RouterPaneSiblingContext): UnresolvedPaneNode
}

export type PaneNodeResolver = (id: string, context: RouterPaneSiblingContext) => UnresolvedPaneNode

export type UnresolvedPaneNode =
  | PaneNodeResolver
  | SerializablePaneNode
  | Subscribable<UnresolvedPaneNode>
  | PromiseLike<UnresolvedPaneNode>
  | PaneNode
