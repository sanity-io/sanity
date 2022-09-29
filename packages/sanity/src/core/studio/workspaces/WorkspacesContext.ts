import {createContext} from 'react'
import {WorkspaceSummary} from '../../config'

/** @internal */
export type WorkspacesContextValue = WorkspaceSummary[]

/** @internal */
export const WorkspacesContext = createContext<WorkspacesContextValue | null>(null)
