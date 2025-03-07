import {type EditorSelection} from '@portabletext/editor'
import {type StackablePerspective} from '@sanity/client'
import {type Path, type SanityDocumentLike} from '@sanity/types'
import {type ComponentType, type ReactNode} from 'react'
import {
  type DocumentListPaneNode,
  type DocumentPaneNode,
  type ListPaneNode,
  type PaneNode,
} from 'sanity/structure'

/**
 * @internal
 * @hidden
 */
export type DocumentStub = {_id: string; _type: string}

/**
 * @internal
 * @hidden
 */
export interface DocumentPaneInfo {
  type: 'document'
  id: string
  active: boolean
  index: number
  pane: PaneNode
  document: SanityDocumentLike
}
export interface DocumentListPaneInfo {
  type: 'documentList'
  id: string
  active: boolean
  index: number
  pane: PaneNode
  query?: DocumentListPaneQuery
  results: DocumentStub[]
}
export interface ListPaneInfo {
  type: 'list'
  id: string
  active: boolean
  index: number
  pane: PaneNode
}
export type PaneInfo = DocumentPaneInfo | DocumentListPaneInfo | ListPaneInfo

/**
 * @internal
 * @hidden
 */
export interface MCPAgentContext {
  panes: PaneInfo[]
  focus?: {
    path?: Path
    selection?: EditorSelection
    document?: SanityDocumentLike
  }
}

/**
 * @internal
 * @hidden
 */
export type MCPComponentProps = {
  children?: ReactNode
  active?: boolean
  onDeactivate?: () => void
  context: MCPAgentContext
}

/**
 * @internal
 * @hidden
 */
export interface MCPConfig {
  /**
   * Hotkey to invoke MCP dialog
   * Parsed by https://www.npmjs.com/package/is-hotkey
   * Default is mod+j
   */
  hotkey?: string
  component: ComponentType<MCPComponentProps>
}

/**
 * @internal
 * @hidden
 */
export type MCPFocusEvent = {
  type: 'UPDATE_FOCUS'
  path?: Path
  selection?: EditorSelection
  document?: SanityDocumentLike
}

/**
 * @internal
 * @hidden
 */
export type MCPPaneUpdateEventBase = {
  type: 'UPDATE_PANE'
  index: number
  active: boolean
  id: string
}

/**
 * @internal
 * @hidden
 */
export interface MCPDocumentPaneUpdateEvent extends MCPPaneUpdateEventBase {
  paneType: 'document'
  pane: DocumentPaneNode
  document: SanityDocumentLike
}

/**
 * @internal
 * @hidden
 */
export interface MCPListPaneUpdateEvent extends MCPPaneUpdateEventBase {
  paneType: 'list'
  id: string
  pane: ListPaneNode
}

type DocumentListPaneQuery = {
  filter: string
  perspective: StackablePerspective[]
  params?: Record<string, unknown>
  searchQuery?: string
}
/**
 * @internal
 * @hidden
 */
export interface MCPDocumentListPaneUpdateEvent extends MCPPaneUpdateEventBase {
  paneType: 'documentList'
  pane: DocumentListPaneNode
  query?: DocumentListPaneQuery
  results: DocumentStub[]
}

/**
 * @internal
 * @hidden
 */
export interface MCPRemovePaneEvent {
  type: 'REMOVE_PANE'
  id: string
}

/**
 * @internal
 * @hidden
 */
export type MCPUpdatePaneEvent =
  | MCPDocumentPaneUpdateEvent
  | MCPDocumentListPaneUpdateEvent
  | MCPListPaneUpdateEvent

/**
 * @internal
 * @hidden
 */
export type MCPEvent = MCPFocusEvent | MCPUpdatePaneEvent | MCPRemovePaneEvent

/**
 * @internal
 * @hidden
 */
export interface MCPProviderContextValue {
  onEvent: (mcpEvent: MCPEvent) => void
}
