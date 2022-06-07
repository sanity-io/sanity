import {createContext} from 'react'
import {WorkspaceSummary} from '../../config'

export type WorkspacesContextValue = WorkspaceSummary[]

export const WorkspacesContext = createContext<WorkspacesContextValue | null>(null)
