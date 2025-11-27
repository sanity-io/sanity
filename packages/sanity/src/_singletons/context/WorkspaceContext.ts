import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {Workspace} from '../../core/config/types'

/**
 * @internal
 */
export const WorkspaceContext: Context<Workspace | null> = createContext<Workspace | null>(
  'sanity/_singletons/context/workspace',
  null,
)
