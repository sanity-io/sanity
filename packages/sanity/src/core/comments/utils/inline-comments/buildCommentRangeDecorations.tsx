import {type RangeDecoration, type RangeDecorationOnMovedDetails} from '@portabletext/editor'
import {type PortableTextBlock} from '@sanity/types'
import {
  createContext,
  memo,
  type MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {CommentInlineHighlightSpan} from '../../components'
import {applyInlineCommentIdAttr} from '../../hooks'
import {type CommentDocument, type CommentRangeEntry} from '../../types'
import {buildRangeDecorationSelectionsFromComments} from './buildRangeDecorationSelectionsFromComments'

const EMPTY_ARRAY: string[] = []

/**
 * Context that tracks all comment IDs at the current nesting level.
 * When decorations overlap, the PTE renders nested spans -- each decoration
 * reads the parent IDs from context, adds its own, and provides the combined
 * set to its children.
 */
const OverlappingCommentsContext = createContext<string[]>(EMPTY_ARRAY)

/**
 * Context for dynamic state that changes independently of decoration
 * structure (selection, payload). The PTE editor only re-renders decorations
 * when selection/payload change (deep equality check). Hover and selected
 * states change frequently without affecting structure, so decoration
 * components read them from this context to get React re-renders without
 * needing the PTE to diff decorations.
 */
export interface CommentDecorationStateContextValue {
  hoveredCommentIds: ReadonlySet<string>
  selectedThreadId: string | null
  onClick: (commentId: string, allCommentIds: string[]) => void
  onHoverStart: (commentId: string) => void
  onHoverEnd: (commentId: string) => void
}

const EMPTY_SET: ReadonlySet<string> = new Set()
const noop = () => {}

export const CommentDecorationStateContext = createContext<CommentDecorationStateContextValue>({
  hoveredCommentIds: EMPTY_SET,
  selectedThreadId: null,
  onClick: noop,
  onHoverStart: noop,
  onHoverEnd: noop,
})

interface CommentRangeDecorationProps {
  children: React.ReactNode
  commentId: string
  threadId: string
}

const CommentRangeDecoration = memo(function CommentRangeDecoration(
  props: CommentRangeDecorationProps,
) {
  const {children, commentId, threadId} = props
  const decoratorRef = useRef<HTMLSpanElement | null>(null)
  const [isNested, setIsNested] = useState(false)
  const [parentCommentId, setParentCommentId] = useState<string | null>(null)

  const {hoveredCommentIds, selectedThreadId, onClick, onHoverStart, onHoverEnd} = useContext(
    CommentDecorationStateContext,
  )

  const parentCommentIds = useContext(OverlappingCommentsContext)
  const allCommentIds = useMemo(
    () => [...parentCommentIds, commentId],
    [parentCommentIds, commentId],
  )

  useEffect(() => {
    const prevEl = decoratorRef.current?.previousSibling as HTMLElement | null
    const nextEl = decoratorRef.current?.nextSibling as HTMLElement | null

    if (!prevEl || !nextEl) {
      setIsNested(false)
      return
    }

    const [key] = Object.keys(applyInlineCommentIdAttr(''))

    const prevId = prevEl.getAttribute(key)
    const nextId = nextEl.getAttribute(key)

    const isNestedDecorator = Boolean(prevId && nextId && prevId === nextId)
    setParentCommentId(isNestedDecorator ? prevId : null)
    setIsNested(isNestedDecorator)
  }, [])

  const handleMouseEnter = useCallback(() => onHoverStart(commentId), [commentId, onHoverStart])
  const handleMouseLeave = useCallback(() => onHoverEnd(commentId), [commentId, onHoverEnd])
  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      onClick(commentId, allCommentIds)
    },
    [commentId, allCommentIds, onClick],
  )

  const hovered =
    hoveredCommentIds.has(commentId) ||
    (parentCommentId !== null && hoveredCommentIds.has(parentCommentId) && isNested)
  const selected = selectedThreadId === threadId

  return (
    <OverlappingCommentsContext.Provider value={allCommentIds}>
      <CommentInlineHighlightSpan
        isAdded
        isHovered={hovered || selected}
        isNested={isNested}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={decoratorRef}
        {...applyInlineCommentIdAttr(threadId)}
      >
        {children}
      </CommentInlineHighlightSpan>
    </OverlappingCommentsContext.Provider>
  )
})
CommentRangeDecoration.displayName = 'Memo(CommentRangeDecoration)'

interface BuildRangeDecorationsProps {
  comments: CommentDocument[]
  commentRangeEntries: CommentRangeEntry[]
  onDecorationMoved: (details: RangeDecorationOnMovedDetails) => void
  value: PortableTextBlock[] | undefined
}

/**
 * @internal
 */
export interface BuildCommentRangeDecorationsResult {
  decorations: RangeDecoration[]
  detachedCommentIds: string[]
}

export function buildCommentRangeDecorations(
  props: BuildRangeDecorationsProps,
): BuildCommentRangeDecorationsResult {
  const {comments, commentRangeEntries, onDecorationMoved, value} = props
  const result = buildRangeDecorationSelectionsFromComments({comments, commentRangeEntries, value})

  const decorations = result.decorations.map(({selection, comment}) => {
    const decoration: RangeDecoration = {
      component: ({children}) => (
        <CommentRangeDecoration commentId={comment._id} threadId={comment.threadId}>
          {children}
        </CommentRangeDecoration>
      ),
      onMoved: onDecorationMoved,
      selection,
      payload: {
        commentId: comment._id,
      },
    }
    return decoration
  })
  return {decorations, detachedCommentIds: result.detachedCommentIds}
}
