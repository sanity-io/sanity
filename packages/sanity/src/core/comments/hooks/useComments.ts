import {useContext} from 'react'
import {CommentsContext} from 'sanity/_singletons'

import {type CommentsContextValue} from '../context/comments/types'

/**
 * @internal
 */
export function useComments(): CommentsContextValue {
  const value = useContext(CommentsContext)

  if (!value) {
    throw new Error('useComments must be used within a CommentsProvider')
  }

  return value
}
