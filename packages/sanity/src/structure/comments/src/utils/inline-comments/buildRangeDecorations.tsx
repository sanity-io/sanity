import {type RangeDecoration} from '@sanity/portable-text-editor'
import {memo, useCallback, useEffect, useRef} from 'react'

import {CommentInlineHighlightSpan} from '../../components'
import {applyInlineCommentIdAttr} from '../../hooks'
import {type CommentMessage, type CommentThreadItem} from '../../types'
import {buildRangeDecorationSelectionsFromComments} from './buildRangeDecorationSelectionsFromComments'

interface CommentRangeDecorationProps {
  children: React.ReactNode
  commentId: string
  currentHoveredCommentId: string | null
  onClick: (commentId: string) => void
  onHoverEnd: (commentId: null) => void
  onHoverStart: (commentId: string) => void
  selectedThreadId: string | null
  threadId: string
}

const CommentRangeDecoration = memo(function CommentRangeDecoration(
  props: CommentRangeDecorationProps,
) {
  const {
    children,
    commentId,
    currentHoveredCommentId,
    onClick,
    onHoverEnd,
    onHoverStart,
    selectedThreadId,
    threadId,
  } = props
  const decoratorRef = useRef<HTMLSpanElement | null>(null)
  const isNestedRef = useRef<boolean>(false)
  const parentCommentId = useRef<string | null>(null)

  useEffect(() => {
    // Get the previous and next sibling of the decorator element
    const prevEl = decoratorRef.current?.previousSibling as HTMLElement | null
    const nextEl = decoratorRef.current?.nextSibling as HTMLElement | null

    // If there is no previous or next sibling, then the decorator is not nested
    if (!prevEl || !nextEl) {
      isNestedRef.current = false
      return
    }

    // We use the `applyInlineCommentIdAttr` to get the key of the data attribute
    // used for the inline comment id on the decorator element.
    const [key] = Object.keys(applyInlineCommentIdAttr(''))

    const prevId = prevEl.getAttribute(key)
    const nextId = nextEl.getAttribute(key)

    const isEqual = prevId === nextId

    const isNestedDecorator = Boolean(prevId && nextId && isEqual)
    parentCommentId.current = isNestedDecorator ? prevId : null

    isNestedRef.current = isNestedDecorator
  }, [])

  const handleMouseEnter = useCallback(() => onHoverStart(commentId), [commentId, onHoverStart])
  const handleMouseLeave = useCallback(() => onHoverEnd(null), [onHoverEnd])
  const handleClick = useCallback(() => onClick(commentId), [commentId, onClick])

  const hovered =
    currentHoveredCommentId === commentId ||
    (currentHoveredCommentId === parentCommentId.current && isNestedRef.current)

  const selected = selectedThreadId === threadId

  return (
    <CommentInlineHighlightSpan
      isAdded
      isHovered={hovered || selected}
      isNested={isNestedRef.current}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={decoratorRef}
      {...applyInlineCommentIdAttr(threadId)}
    >
      {children}
    </CommentInlineHighlightSpan>
  )
})

function isRangeInvalid() {
  return false
}

interface BuildRangeDecorationsProps {
  comments: CommentThreadItem[]
  currentHoveredCommentId: string | null
  onDecoratorClick: (commentId: string) => void
  onDecoratorHoverEnd: (commentId: null) => void
  onDecoratorHoverStart: (commentId: string) => void
  selectedThreadId: string | null
  value: CommentMessage | undefined
}

export function buildRangeDecorations(props: BuildRangeDecorationsProps) {
  const {
    comments,
    currentHoveredCommentId,
    onDecoratorClick,
    onDecoratorHoverEnd,
    onDecoratorHoverStart,
    selectedThreadId,
    value,
  } = props
  const rangeSelections = buildRangeDecorationSelectionsFromComments({comments, value})

  const decorations = rangeSelections.map(({selection, comment, range}) => {
    const decoration: RangeDecoration = {
      component: ({children}) => (
        <CommentRangeDecoration
          commentId={comment.parentComment._id}
          currentHoveredCommentId={currentHoveredCommentId}
          onClick={onDecoratorClick}
          onHoverEnd={onDecoratorHoverEnd}
          onHoverStart={onDecoratorHoverStart}
          selectedThreadId={selectedThreadId}
          threadId={comment.threadId}
        >
          {children}
        </CommentRangeDecoration>
      ),
      isRangeInvalid,
      selection,
      payload: {
        commentId: comment.parentComment._id,
        range,
      },
    }
    return decoration
  })
  return decorations
}
