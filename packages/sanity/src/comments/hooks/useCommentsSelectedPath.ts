import {useContext} from 'react'

import {CommentsSelectedPathContext, type CommentsSelectedPathContextValue} from '../context'

export function useCommentsSelectedPath(): CommentsSelectedPathContextValue {
  const ctx = useContext(CommentsSelectedPathContext)

  if (!ctx) {
    throw new Error('useCommentsSelectedPath: missing context value')
  }

  return ctx
}
