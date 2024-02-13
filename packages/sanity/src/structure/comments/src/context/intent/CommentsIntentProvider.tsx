import {memo, type ReactNode} from 'react'

import {type CommentIntentGetter} from '../../types'
import {CommentsIntentContext} from './CommentsIntentContext'

interface CommentsIntentProviderProps {
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
