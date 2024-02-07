import {RangeDecoration} from '@sanity/portable-text-editor'
import {useRef, useEffect, useCallback, memo} from 'react'
import {CommentMessage, CommentThreadItem} from '../../types'
import {applyInlineCommentIdAttr} from '../../hooks'
import {CommentInlineHighlightSpan} from '../../components'
import {buildRangeDecorationSelectionsFromComments} from './buildRangeDecorationSelectionsFromComments'

interface CommentRangeDecoratorProps {
  children: React.ReactNode
  commentId: string
  currentHoveredCommentId: string | null
  onClick: (commentId: string) => void
  onHoverEnd: (commentId: null) => void
  onHoverStart: (commentId: string) => void
  selectedThreadId: string | null
  threadId: string
}

const CommentRangeDecorator = memo(function CommentRangeDecorator(
  props: CommentRangeDecoratorProps,
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

    const prevId = prevEl.getAttribute('data-inline-comment-id')
    const nextId = nextEl.getAttribute('data-inline-comment-id')

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
      data-inline-comment-id={commentId}
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

interface BuildRangeDecoratorsProps {
  comments: CommentThreadItem[]
  currentHoveredCommentId: string | null
  onDecoratorClick: (commentId: string) => void
  onDecoratorHoverEnd: (commentId: null) => void
  onDecoratorHoverStart: (commentId: string) => void
  selectedThreadId: string | null
  value: CommentMessage | undefined
}

export function buildRangeDecorators(props: BuildRangeDecoratorsProps) {
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

  return rangeSelections.map(({selection, comment}) => {
    const decorator: RangeDecoration = {
      component: ({children}) => (
        <CommentRangeDecorator
          commentId={comment.parentComment._id}
          currentHoveredCommentId={currentHoveredCommentId}
          onClick={onDecoratorClick}
          onHoverEnd={onDecoratorHoverEnd}
          onHoverStart={onDecoratorHoverStart}
          selectedThreadId={selectedThreadId}
          threadId={comment.threadId}
        >
          {children}
        </CommentRangeDecorator>
      ),
      isRangeInvalid,
      selection,
    }

    return decorator
  })
}
