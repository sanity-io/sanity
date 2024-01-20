import {isEqual} from 'lodash'
import {useMemo, useRef} from 'react'
import {isPortableTextSpan, isPortableTextTextBlock} from 'sanity'

import {type CommentMessage} from './types'

export function useCommentHasChanged(message: CommentMessage): boolean {
  const prevMessage = useRef<CommentMessage>(message)

  return useMemo(() => !isEqual(prevMessage.current, message), [message])
}

export function hasCommentMessageValue(value: CommentMessage): boolean {
  if (!value) return false

  return value?.some(
    (block) =>
      isPortableTextTextBlock(block) &&
      (block?.children || [])?.some((c) => (isPortableTextSpan(c) ? c.text : c.userId)),
  )
}
