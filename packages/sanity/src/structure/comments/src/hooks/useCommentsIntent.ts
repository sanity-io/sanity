import {useContext} from 'react'

import {CommentsIntentContext} from '../context'
import {type CommentIntentGetter} from '../types'

/**
 * @beta
 * @hidden
 */
export function useCommentsIntent(): CommentIntentGetter | undefined {
  return useContext(CommentsIntentContext)
}
