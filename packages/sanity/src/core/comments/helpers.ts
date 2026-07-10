import {isPortableTextSpan, isPortableTextTextBlock, type Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import isEqual from 'lodash-es/isEqual.js'
import {useMemo, useState} from 'react'

import {type CommentContext, type CommentDocument, type CommentMessage} from './types'

export function useCommentHasChanged(message: CommentMessage): boolean {
  const [prevMessage] = useState<CommentMessage>(message)

  return useMemo(() => !isEqual(prevMessage, message), [prevMessage, message])
}

/**
 * @internal
 */
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

/**
 * Parse a comment's persisted `fieldPath` string. Returns `undefined` for
 * empty or unparseable values: `fieldPath` is stored data, and a corrupt
 * comment must not crash rendering.
 * @internal
 */
export function parseCommentFieldPath(fieldPath: string | null | undefined): Path | undefined {
  if (!fieldPath) return undefined
  try {
    return PathUtils.fromString(fieldPath)
  } catch {
    return undefined
  }
}

/**
 * A function that checks whether a comment is a text selection comment
 * @internal
 */
export function isTextSelectionComment(comment: CommentDocument): boolean {
  if (!comment) return false

  return Boolean(
    comment?.target?.path?.selection?.type === 'text' && comment?.target?.path?.selection?.value,
  )
}
