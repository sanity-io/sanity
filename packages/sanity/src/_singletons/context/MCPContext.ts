import {createContext} from 'sanity/_createContext'

import type {MCPProviderContextValue} from '../../core/mcp'

export type {MCPProviderContextValue}
/**
 * @internal
 */
export const MCPContext = createContext<MCPProviderContextValue | null>(
  'sanity/_singletons/context/mcp',
  null,
)
