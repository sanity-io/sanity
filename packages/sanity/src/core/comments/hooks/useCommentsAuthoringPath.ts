import {useContext} from 'react'
import {CommentsAuthoringPathContext} from 'sanity/_singletons'

import type {CommentsAuthoringPathContextValue} from '../context/authoring-path/types'

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
