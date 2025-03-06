import {type EditorSelection} from '@portabletext/editor'
import {type Path, type SanityDocumentLike} from '@sanity/types'
import {type ComponentType, type ReactNode} from 'react'
/**
 * @internal
 * @hidden
 */
export interface MCPAgentContext {
  list?: TODO
  presence?: TODO
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
  component: ComponentType<MCPComponentProps>
}

/**
 * @internal
 * @hidden
 */
export type TODO = never

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
export type MCPEvent = MCPFocusEvent

/**
 * @internal
 * @hidden
 */
export interface MCPProviderContextValue {
  onEvent: (mcpEvent: MCPEvent) => void
}
