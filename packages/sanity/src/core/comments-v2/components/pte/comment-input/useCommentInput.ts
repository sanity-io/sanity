import {useContext} from 'react'
import {CommentInputContextV2} from 'sanity/_singletons'

import {type CommentInputContextValue} from './CommentInputProvider'

export function useCommentInput(): CommentInputContextValue {
  const ctx = useContext(CommentInputContextV2)

  if (!ctx) {
    throw new Error('useCommentInputContext must be used within a CommentInputProvider')
  }

  return ctx
}
