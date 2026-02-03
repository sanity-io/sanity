import {useContext} from 'react'
import {CommentInputContext} from 'sanity/_singletons'

import {type CommentInputContextValue} from './CommentInputProvider'

export function useCommentInput(): CommentInputContextValue {
  const ctx = useContext(CommentInputContext)

  if (!ctx) {
    throw new Error('useCommentInputContext must be used within a CommentInputProvider')
  }

  return ctx
}
