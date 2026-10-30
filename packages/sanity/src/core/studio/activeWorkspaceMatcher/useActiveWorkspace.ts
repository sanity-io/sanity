import {use} from 'react'
import {ActiveWorkspaceMatcherContext} from 'sanity/_singletons'

import {type ActiveWorkspaceMatcherContextValue} from './ActiveWorkspaceMatcherContext'

/** @internal */
export function useActiveWorkspace(): ActiveWorkspaceMatcherContextValue {
  const value = use(ActiveWorkspaceMatcherContext)
  if (!value) throw new Error('Could not find `ActiveWorkspaceMatcher` context')
  return value
}
