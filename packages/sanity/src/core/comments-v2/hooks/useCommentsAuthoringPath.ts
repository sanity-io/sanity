import {useContext} from 'react'
import {CommentsAuthoringPathContextV2} from 'sanity/_singletons'

import {type CommentsAuthoringPathContextValue} from '../context/authoring-path/types'

/**
 * @beta
 * @hidden
 */
export function useCommentsAuthoringPath(): CommentsAuthoringPathContextValue {
  const value = useContext(CommentsAuthoringPathContextV2)

  if (!value) {
    throw new Error('useCommentsAuthoringPath: missing context value')
  }

  return value
}
