import {useContext} from 'react'

import {CommentsAuthoringPathContext} from '../context/authoring-path/CommentsAuthoringPathContext'
import {type CommentsAuthoringPathContextValue} from '../context/authoring-path/types'

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
