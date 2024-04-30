import {createContext} from 'react'

import type {ActiveWorkspaceMatcherContextValue} from '../../../../core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherContext'

/** @internal */
export const ActiveWorkspaceMatcherContext =
  createContext<ActiveWorkspaceMatcherContextValue | null>(null)
