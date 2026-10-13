import {createContext} from 'react'

import type {VisibleWorkspacesContextValue} from '../../core/studio/workspaces/VisibleWorkspacesProvider'

/** @internal */
export const VisibleWorkspacesContext = createContext<VisibleWorkspacesContextValue | null>(null)
