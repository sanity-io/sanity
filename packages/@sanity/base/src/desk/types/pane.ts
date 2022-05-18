// import {EditStateFor} from '../../'
import {SchemaType, SanityDocument} from '@sanity/types'
import {Subscribable} from 'rxjs'
import {InitialValueTemplateItem} from '../../templates'
import {StructureBuilder, UserComponent} from '../structureBuilder'
import {RouterPaneSiblingContext} from './router'

// export type DocumentActionsResolver = (editState: EditStateFor) => DocumentActionComponent[]

export type DeskToolPaneActionHandler = (params: any, scope?: unknown) => void

type MenuItem = ReturnType<ReturnType<StructureBuilder['menuItem']>['serialize']>

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

export interface CustomComponentPaneNode extends BaseResolvedPaneNode<'component'> {
  component: UserComponent
  options?: Record<string, unknown>
  // component: React.ComponentType<Props> | React.ReactNode

  /**
   * An experimental flag that can be used to opt out of the forced refresh when
   * the `itemId` or `childItemId` changes. See `UserComponentPane`:
   * https://github.com/sanity-io/sanity/commit/8340a003043edf6de3afd9ff628ce93be79978e2
   *
   * @beta
   */
  __preserveInstance?: boolean
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
  source?: string
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
    apiVersion?: string
  }
  schemaTypeName: string
  source?: string
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
  // TODO: mark as unstable or remove
  source?: string
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

// TODO: these types need to be unified with the buidlers `ListBuilder
export type UnresolvedPaneNode =
  | PaneNodeResolver
  | SerializablePaneNode
  | Subscribable<UnresolvedPaneNode>
  | PromiseLike<UnresolvedPaneNode>
  | PaneNode
