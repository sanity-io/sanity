import {type CommentIntentGetter} from '../types'
import {useContext} from 'react'
import {CommentsIntentContext} from 'sanity/_singletons'

/**
 * @beta
 * @hidden
 */
export function useCommentsIntent(): CommentIntentGetter | undefined {
  return useContext(CommentsIntentContext)
}
