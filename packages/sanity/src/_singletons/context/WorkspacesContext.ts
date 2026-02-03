import type {WorkspacesContextValue} from '../../core/studio/workspaces/WorkspacesContext'
import {createContext} from 'sanity/_createContext'

/** @internal */
export const WorkspacesContext = createContext<WorkspacesContextValue | null>(
  'sanity/_singletons/context/workspaces',
  null,
)
