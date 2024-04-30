import {createContext} from 'react'

import type {WorkspacesContextValue} from '../../../../core/studio/workspaces/WorkspacesContext'

/** @internal */
export const WorkspacesContext = createContext<WorkspacesContextValue | null>(null)
