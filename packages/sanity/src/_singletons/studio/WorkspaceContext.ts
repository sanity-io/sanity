import {createContext} from 'react'
import type {Workspace} from 'sanity'

/**
 * @internal
 */
export const WorkspaceContext = createContext<Workspace | null>(null)
