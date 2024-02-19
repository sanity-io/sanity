import {useContext} from 'react'

import {CommentsSetupContext} from './CommentsSetupContext'
import {type CommentsSetupContextValue} from './types'

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
