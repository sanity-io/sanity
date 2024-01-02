import {useContext} from 'react'
import {CommentsEnabledContext} from '../context/enabled'

/**
 * @internal
 * This hook returns a boolean indicating whether comments are enabled or not.
 * It checks if the project has the `studioComments` feature flag enabled and
 * if comments is enabled for the current document in the config API.
 */
export function useCommentsEnabled(): boolean {
  const ctx = useContext(CommentsEnabledContext)

  if (ctx === null) {
    throw new Error('useCommentsEnabled: missing context value')
  }

  return ctx
}
