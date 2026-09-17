import {type CollaborationCommentFieldValue, type CollaborationCommentRange} from '@sanity/client'
import {type Path} from '@sanity/types'

import {type CommentDocument, type CommentsTextSelectionItem} from '../../types'
import {buildRangeDecorationSelectionsFromComments} from './buildRangeDecorationSelectionsFromComments'
import {selectionsToRange} from './selectionToRange'

interface BuildCommentRangeUpdateProps {
  comment: CommentDocument
  value: CollaborationCommentFieldValue
  documentValue: unknown
  basePath: Path
}

interface CommentRangeUpdate {
  range: CollaborationCommentRange | null
  selection: {
    type: 'text'
    value: CommentsTextSelectionItem[]
  }
}

/**
 * Rematches an inline comment against the current editor value.
 *
 * Decorations with an empty range text represent selections that no longer
 * reference any content. Exclude them from both the persisted range and the
 * optimistic selection so a fully unanchored comment clears its API range.
 */
export function buildCommentRangeUpdate(props: BuildCommentRangeUpdateProps): CommentRangeUpdate {
  const {comment, value, documentValue, basePath} = props

  const updatedDecorations = buildRangeDecorationSelectionsFromComments({
    comments: [comment],
    value,
    documentValue,
    basePath,
  })

  const anchoredDecorations = updatedDecorations.filter((decoration) => decoration.range.text)
  const updatedKeys = new Set(updatedDecorations.map((decoration) => decoration.range._key))
  const unchangedRanges =
    comment.target.path?.selection?.value.filter((range) => !updatedKeys.has(range._key)) || []
  const nextRanges = anchoredDecorations.map((decoration) => decoration.range)

  return {
    range: selectionsToRange(
      anchoredDecorations.map((decoration) => decoration.selection),
      value,
    ),
    selection: {
      type: 'text',
      value: [...unchangedRanges, ...nextRanges].sort((a, b) => a._key.localeCompare(b._key)),
    },
  }
}
