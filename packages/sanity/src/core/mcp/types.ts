import {type Path, type PortableTextBlock, type SanityDocumentLike} from '@sanity/types'
import {type ComponentType, type ReactNode} from 'react'
/**
 * @internal
 * @hidden
 */
export interface MCPAgentContext {
  list?: TODO
  presence?: TODO
  selection?: {
    document?: SanityDocumentLike
    path?: Path
    contents?: string | PortableTextBlock[]
  }
}

/**
 * @internal
 * @hidden
 */
export type MCPComponentProps = {
  children?: ReactNode
  active?: boolean
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

/**
 * @internal
 * @hidden
 */
export type MCPEvent = never

/**
 * @internal
 * @hidden
 */
export interface MCPProviderContextValue {
  onEvent: (mcpEvent: MCPEvent) => void
}
