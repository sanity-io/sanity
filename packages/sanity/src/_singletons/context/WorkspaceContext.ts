import type {Workspace} from '../../core/config/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const WorkspaceContext = createContext<Workspace | null>(
  'sanity/_singletons/context/workspace',
  null,
)
