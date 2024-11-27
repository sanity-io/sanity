import {useContext} from 'react'
import {CommentsSelectedPathContext} from 'sanity/_singletons'

import {type CommentsSelectedPathContextValue} from '../context'

/**
 * @internal
 */
export function useCommentsSelectedPath(): CommentsSelectedPathContextValue {
  const ctx = useContext(CommentsSelectedPathContext)

  if (!ctx) {
    throw new Error('useCommentsSelectedPath: missing context value')
  }

  return ctx
}
