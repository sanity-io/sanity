import {use} from 'react'
import {CommentsContextV2} from 'sanity/_singletons'

import {type CommentsContextValue} from '../context/comments/types'

/**
 * @hidden
 * @beta
 */
export function useComments(): CommentsContextValue {
  const value = use(CommentsContextV2)

  if (!value) {
    throw new Error('useComments must be used within a CommentsProvider')
  }

  return value
}
