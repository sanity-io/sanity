import type {Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {ActiveWorkspaceMatcherContextValue} from '../../core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherContext'

/** @internal */
export const ActiveWorkspaceMatcherContext: Context<ActiveWorkspaceMatcherContextValue | null> =
  createContext('sanity/_singletons/context/active-workspace-matcher', null)
