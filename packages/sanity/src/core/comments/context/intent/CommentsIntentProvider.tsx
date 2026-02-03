import {memo, type ReactNode} from 'react'
import {CommentsIntentContext} from 'sanity/_singletons'

import {type CommentIntentGetter} from '../../types'

/**
 * @beta
 * @hidden
 */
export interface CommentsIntentProviderProps {
  children: ReactNode
  getIntent: CommentIntentGetter
}

/**
 * @beta
 * @hidden
 */
export const CommentsIntentProvider = memo(function CommentsIntentProvider(
  props: CommentsIntentProviderProps,
) {
  const {children, getIntent} = props

  return (
    <CommentsIntentContext.Provider value={getIntent}>{children}</CommentsIntentContext.Provider>
  )
})
