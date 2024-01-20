import {useContext} from 'react'

import {CommentsContext} from '../context'
import {type CommentsContextValue} from '../context/comments/types'

/**
 * @beta
 * @hidden
 */
export function useComments(): CommentsContextValue {
  const value = useContext(CommentsContext)

  if (!value) {
    throw new Error('useComments must be used within a CommentsProvider')
  }

  return value
}
