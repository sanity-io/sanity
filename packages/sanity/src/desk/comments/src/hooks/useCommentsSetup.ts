import {useContext} from 'react'
import {CommentsSetupContext, CommentsSetupContextValue} from '../context'

/**
 * @beta
 * @hidden
 */
export function useCommentsSetup(): CommentsSetupContextValue {
  const ctx = useContext(CommentsSetupContext)

  if (!ctx) {
    throw new Error('useCommentsSetup: missing context value')
  }

  return ctx
}
