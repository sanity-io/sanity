import {useContext} from 'react'

import {CommentsSetupContext, type CommentsSetupContextValue} from '../context'

export function useCommentsSetup(): CommentsSetupContextValue {
  const ctx = useContext(CommentsSetupContext)

  if (!ctx) {
    throw new Error('useCommentsSetup: missing context value')
  }

  return ctx
}
