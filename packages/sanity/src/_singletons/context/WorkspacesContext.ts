import {createContext} from 'sanity/_createContext'

import type {WorkspacesContextValue} from '../../core/studio/workspaces/WorkspacesContext'

/** @internal */
export const WorkspacesContext: React.Context<WorkspacesContextValue | null> =
  createContext<WorkspacesContextValue | null>('sanity/_singletons/context/workspaces', null)
