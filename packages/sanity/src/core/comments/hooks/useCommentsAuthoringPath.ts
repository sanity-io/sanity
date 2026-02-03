import {type CommentsAuthoringPathContextValue} from '../context'
import {useContext} from 'react'
import {CommentsAuthoringPathContext} from 'sanity/_singletons'

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
