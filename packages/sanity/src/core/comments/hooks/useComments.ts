import {useContext} from 'react'
import {CommentsContext} from '../context/CommentsContext'
import {CommentsContextValue} from '../types'

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
