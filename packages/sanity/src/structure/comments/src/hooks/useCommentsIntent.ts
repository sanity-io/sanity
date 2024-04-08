import {useContext} from 'react'
import {CommentsIntentContext} from 'sanity/_singletons'

import {type CommentIntentGetter} from '../types'

/**
 * @beta
 * @hidden
 */
export function useCommentsIntent(): CommentIntentGetter | undefined {
  return useContext(CommentsIntentContext)
}
