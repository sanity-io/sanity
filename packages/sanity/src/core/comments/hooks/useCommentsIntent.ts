import {useContext} from 'react'

import {CommentsIntentContext} from '../context/intent/CommentsIntentContext'
import {type CommentIntentGetter} from '../types'

/**
 * @beta
 * @hidden
 */
export function useCommentsIntent(): CommentIntentGetter | undefined {
  return useContext(CommentsIntentContext)
}
