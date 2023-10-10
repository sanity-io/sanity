import {useContext} from 'react'
import {CommentsContextValue} from '../context/comments/types'
import {CommentsContext} from '../context'

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
