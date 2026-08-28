import {useContext} from 'react'
import {CommentsAuthoringPathLegacyContext} from 'sanity/_singletons'

import {type CommentsAuthoringPathContextValue} from '../context/authoring-path/types'

/**
 * @beta
 * @hidden
 */
export function useCommentsAuthoringPath(): CommentsAuthoringPathContextValue {
  const value = useContext(CommentsAuthoringPathLegacyContext)

  if (!value) {
    throw new Error('useCommentsAuthoringPath: missing context value')
  }

  return value
}
