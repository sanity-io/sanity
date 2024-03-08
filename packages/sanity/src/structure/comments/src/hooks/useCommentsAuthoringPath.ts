import {useContext} from 'react'

import {CommentsAuthoringPathContext, type CommentsAuthoringPathContextValue} from '../context'

/**
 * @beta
 * @hidden
 */
export function useCommentsAuthoringPath(): CommentsAuthoringPathContextValue {
  const value = useContext(CommentsAuthoringPathContext)

  if (!value) {
    throw new Error('useCommentsAuthoringPath: missing context value')
  }

  return value
}
