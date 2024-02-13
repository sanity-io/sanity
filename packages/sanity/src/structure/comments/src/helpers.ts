import {isEqual} from 'lodash'
import {useMemo, useRef} from 'react'
import {isPortableTextSpan, isPortableTextTextBlock} from 'sanity'

import {type CommentContext, type CommentDocument, type CommentMessage} from './types'

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

export function commentIntentIfDiffers(
  parent?: CommentDocument,
  comment?: CommentDocument,
): CommentContext['intent'] | undefined {
  const parentIntent = parent?.context?.intent
  const intent = comment?.context?.intent
  // If no intent, nothing to return
  if (!intent) return undefined
  // If no parent intent, no comparison necessary
  if (!parentIntent) return intent
  // If the preview param differs, return the intent
  if (
    'preview' in intent.params &&
    'preview' in parentIntent.params &&
    intent.params.preview !== parentIntent.params.preview
  ) {
    return intent
  }
  return undefined
}
