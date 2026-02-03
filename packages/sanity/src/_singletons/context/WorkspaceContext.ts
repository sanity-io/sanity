import {createContext} from 'sanity/_createContext'

import type {Workspace} from '../../core/config/types'

/**
 * @internal
 */
export const WorkspaceContext = createContext<Workspace | null>(
  'sanity/_singletons/context/workspace',
  null,
)
