import {createContext} from 'sanity/_createContext'

import type {VisibleWorkspacesContextValue} from '../../core/studio/workspaces/VisibleWorkspacesProvider'

/** @internal */
export const VisibleWorkspacesContext = createContext<VisibleWorkspacesContextValue | null>(
  'sanity/_singletons/context/visible-workspaces',
  null,
)
