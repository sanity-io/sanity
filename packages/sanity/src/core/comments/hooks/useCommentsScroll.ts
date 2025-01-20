import {useCallback, useEffect, useMemo, useState} from 'react'
import scrollIntoViewIfNeeded, {type StandardBehaviorOptions} from 'scroll-into-view-if-needed'

const BASE_SCROLL_OPTIONS: StandardBehaviorOptions = {
  behavior: 'smooth',
  inline: 'center',
  scrollMode: 'if-needed',
}

const GROUP_SCROLL_OPTIONS: StandardBehaviorOptions = {
  ...BASE_SCROLL_OPTIONS,
  block: 'start',
}

const INLINE_COMMENT_SCROLL_OPTIONS: StandardBehaviorOptions = {
  ...BASE_SCROLL_OPTIONS,
  block: 'center',
}

const SCROLL_TO_FIELD_OPTIONS: StandardBehaviorOptions = {
  ...BASE_SCROLL_OPTIONS,
  block: 'center',
}

const SCROLL_TO_COMMENT_OPTIONS: StandardBehaviorOptions = {
  ...BASE_SCROLL_OPTIONS,
  block: 'center',
}

const SCROLL_OPTIONS_BY_TYPE: Record<ScrollTargetTypes, StandardBehaviorOptions> = {
  'comment': SCROLL_TO_COMMENT_OPTIONS,
  'field': SCROLL_TO_FIELD_OPTIONS,
  'group': GROUP_SCROLL_OPTIONS,
  'inline-comment': INLINE_COMMENT_SCROLL_OPTIONS,
}

/**
 * A utility function that can be used to generate a valid attribute value
 * based on the given ID.
 *
 * Generate a value that can be used as an attribute value in HTML based
 * on the given ID. This is needed because, when we use the path of a field
 * as a data attribute value, we need to escape the value so that it can be
 * queried using `querySelector`.
 *
 * Example:
 *
 * ```js
 * const validId = generateValidAttrValue('[field[_key=="title"]')
 *
 * return <div data-field-id={validId}>...</div>
 * ```
 */
function generateValidAttrValue(id: string): string {
  const symbolsToRemove = /[[\]_"_=.]/g

  const result = id.replace(symbolsToRemove, '')

  return result
}

export function applyCommentIdAttr(id: string): Record<'data-comments-comment-id', string> {
  return {
    'data-comments-comment-id': generateValidAttrValue(id),
  }
}

export function applyCommentsFieldAttr(id: string): Record<'data-comments-field-id', string> {
  return {
    'data-comments-field-id': generateValidAttrValue(id),
  }
}

export function applyCommentsGroupAttr(id: string): Record<'data-comments-group-id', string> {
  return {
    'data-comments-group-id': generateValidAttrValue(id),
  }
}

export function applyInlineCommentIdAttr(
  id: string,
): Record<'data-comments-inline-comment-id', string> {
  return {
    'data-comments-inline-comment-id': generateValidAttrValue(id),
  }
}

interface CommentsScrollHookValue {
  /**
   * Scroll to the comment with the given ID.
   */
  scrollToComment: (commentId: string) => void
  /**
   * Scroll to the field with the given ID.
   */
  scrollToField: (fieldId: string) => void
  /**
   * Scroll to the group with the given ID.
   */
  scrollToGroup: (groupId: string) => void
  /**
   * Scroll to the inline comment with the given ID.
   */
  scrollToInlineComment: (commentId: string) => void
}

interface CommentsScrollHookOptions {
  boundaryElement?: HTMLElement | null
}

type ScrollTargetTypes = 'comment' | 'field' | 'group' | 'inline-comment'
interface ScrollTarget {
  type: ScrollTargetTypes
  id: string
}

export function useCommentsScroll(opts?: CommentsScrollHookOptions): CommentsScrollHookValue {
  const {boundaryElement} = opts || {}
  const [scrollTarget, setScrollTarget] = useState<ScrollTarget | null>(null)

  const scrollOpts: StandardBehaviorOptions = useMemo(() => {
    const options = SCROLL_OPTIONS_BY_TYPE[scrollTarget?.type || 'comment']

    return {
      ...options,
      boundary: boundaryElement,
    }
  }, [boundaryElement, scrollTarget?.type])

  const handleScrollToComment = useCallback((commentId: string) => {
    setScrollTarget({type: 'comment', id: commentId})
  }, [])

  const handleScrollToGroup = useCallback((threadId: string) => {
    setScrollTarget({type: 'group', id: threadId})
  }, [])

  const handleScrollToField = useCallback((fieldPath: string) => {
    setScrollTarget({type: 'field', id: fieldPath})
  }, [])

  const handleScrollToInlineComment = useCallback((commentId: string) => {
    setScrollTarget({type: 'inline-comment', id: commentId})
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (!scrollTarget) return

      const {type, id} = scrollTarget

      const element = document?.querySelector(
        `[data-comments-${type}-id="${generateValidAttrValue(id)}"]`,
      )

      if (element) {
        scrollIntoViewIfNeeded(element, scrollOpts)
      }
    })

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [scrollOpts, scrollTarget])

  const value = useMemo(
    (): CommentsScrollHookValue => ({
      scrollToComment: handleScrollToComment,
      scrollToField: handleScrollToField,
      scrollToGroup: handleScrollToGroup,
      scrollToInlineComment: handleScrollToInlineComment,
    }),
    [handleScrollToComment, handleScrollToField, handleScrollToGroup, handleScrollToInlineComment],
  )

  return value
}
