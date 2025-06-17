import {createContext} from 'sanity/_createContext'

import type {Workspace} from '../../core/config/types'

/**
 * @internal
 */
export const WorkspaceContext: React.Context<Workspace | null> = createContext<Workspace | null>(
  'sanity/_singletons/context/workspace',
  null,
)
