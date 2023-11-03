import {useContext} from 'react'
import {CommentsSelectedPathContext, CommentsSelectedPathContextValue} from '../context'

export function useCommentsSelectedPath(): CommentsSelectedPathContextValue {
  const ctx = useContext(CommentsSelectedPathContext)

  if (!ctx) {
    throw new Error('useCommentsSelectedPath: missing context value')
  }

  return ctx
}
