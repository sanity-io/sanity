import {useMemo, useRef} from 'react'
import {isEqual} from 'lodash'
import {CommentMessage} from './types'
import {isPortableTextSpan, isPortableTextTextBlock} from 'sanity'

/**
 * @beta
 * @hidden
 */
export function useCommentHasChanged(message: CommentMessage): boolean {
  const prevMessage = useRef<CommentMessage>(message)

  return useMemo(() => !isEqual(prevMessage.current, message), [message])
}

/**
 * @beta
 * @hidden
 */
export function hasCommentMessageValue(value: CommentMessage): boolean {
  if (!value) return false

  return value?.some(
    (block) =>
      isPortableTextTextBlock(block) &&
      (block?.children || [])?.some((c) => (isPortableTextSpan(c) ? c.text : c.userId)),
  )
}
