import {use} from 'react'
import {CommentsSelectedPathContext} from 'sanity/_singletons'

import {type CommentsSelectedPathContextValue} from '../context/selected-path/types'

/**
 * @internal
 */
export function useCommentsSelectedPath(): CommentsSelectedPathContextValue {
  const ctx = use(CommentsSelectedPathContext)

  if (!ctx) {
    throw new Error('useCommentsSelectedPath: missing context value')
  }

  return ctx
}
