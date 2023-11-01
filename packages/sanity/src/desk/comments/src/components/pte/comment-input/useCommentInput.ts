import {useContext} from 'react'
import {CommentInputContext, CommentInputContextValue} from './CommentInputProvider'

/**
 * @beta
 * @hidden
 */
export function useCommentInput(): CommentInputContextValue {
  const ctx = useContext(CommentInputContext)

  if (!ctx) {
    throw new Error('useCommentInputContext must be used within a CommentInputProvider')
  }

  return ctx
}
