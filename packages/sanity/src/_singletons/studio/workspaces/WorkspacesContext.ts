import {createContext} from 'react'
import type {WorkspacesContextValue} from 'sanity'

/** @internal */
export const WorkspacesContext = createContext<WorkspacesContextValue | null>(null)
