import {createContext} from 'sanity/_createContext'

import type {ActiveWorkspaceMatcherContextValue} from '../../core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherContext'

/** @internal */
export const ActiveWorkspaceMatcherContext =
  createContext<ActiveWorkspaceMatcherContextValue | null>(
    'sanity/_singletons/context/active-workspace-matcher',
    null,
  )
