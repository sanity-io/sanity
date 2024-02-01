import {RangeDecoration} from '@sanity/portable-text-editor'
import {useState, useRef, useEffect, useCallback} from 'react'
import {HighlightSpan} from '../../../plugin/input/components/HighlightSpan'
import {CommentMessage, CommentThreadItem} from '../../types'
import {generateCommentsInlineCommentIdAttr} from '../../hooks'
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

function CommentRangeDecorator(props: CommentRangeDecoratorProps) {
  const {
    children,
    commentId,
    onHoverEnd,
    onHoverStart,
    currentHoveredCommentId,
    onClick,
    selectedThreadId,
    threadId,
  } = props
  const [decoratorEl, setDecoratorEl] = useState<HTMLSpanElement | null>(null)
  const [isNested, setIsNested] = useState<boolean>(false)
  const parentCommentId = useRef<string | null>(null)

  useEffect(() => {
    // Get the previous and next sibling of the decorator element
    const prevEl = decoratorEl?.previousSibling as HTMLElement | null
    const nextEl = decoratorEl?.nextSibling as HTMLElement | null

    // If there is no previous or next sibling, then the decorator is not nested
    if (!prevEl || !nextEl) {
      setIsNested(false)
      return
    }

    const prevId = prevEl.getAttribute('data-inline-comment-id')
    const nextId = nextEl.getAttribute('data-inline-comment-id')

    const isEqual = prevId === nextId

    const isNestedDecorator = Boolean(prevId && nextId && isEqual)
    parentCommentId.current = isNestedDecorator ? prevId : null

    setIsNested(isNestedDecorator)
  }, [decoratorEl])

  const handleMouseEnter = useCallback(() => onHoverStart(commentId), [commentId, onHoverStart])
  const handleMouseLeave = useCallback(() => onHoverEnd(null), [onHoverEnd])
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      onClick(commentId)
    },
    [commentId, onClick],
  )

  const hovered =
    currentHoveredCommentId === commentId ||
    (currentHoveredCommentId === parentCommentId.current && isNested)

  const selected = selectedThreadId === threadId

  return (
    <HighlightSpan
      data-hovered={hovered || selected}
      data-inline-comment-id={commentId}
      data-inline-comment-state="added"
      data-nested-inline-comment={isNested}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={setDecoratorEl}
      {...generateCommentsInlineCommentIdAttr(threadId)}
    >
      {children}
    </HighlightSpan>
  )
}

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
