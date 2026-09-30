import {use} from 'react'
import {CommentsSelectedPathContextV2} from 'sanity/_singletons'

import {type CommentsSelectedPathContextValue} from '../context/selected-path/types'

/**
 * @internal
 */
export function useCommentsSelectedPath(): CommentsSelectedPathContextValue {
  const ctx = use(CommentsSelectedPathContextV2)

  if (!ctx) {
    throw new Error('useCommentsSelectedPath: missing context value')
  }

  return ctx
}
