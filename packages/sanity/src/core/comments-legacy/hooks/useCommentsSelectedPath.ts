import {useContext} from 'react'
import {CommentsSelectedPathLegacyContext} from 'sanity/_singletons'

import {type CommentsSelectedPathContextValue} from '../context/selected-path/types'

/**
 * @internal
 */
export function useCommentsSelectedPath(): CommentsSelectedPathContextValue {
  const ctx = useContext(CommentsSelectedPathLegacyContext)

  if (!ctx) {
    throw new Error('useCommentsSelectedPath: missing context value')
  }

  return ctx
}
