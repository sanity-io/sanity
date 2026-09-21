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
 * Only blocks the rematch still anchors to are kept. A selection item whose
 * block was deleted, or whose markers no longer resolve, produces no decoration
 * and is dropped, so the optimistic selection mirrors the range the API stores.
 * A comment left with no anchored block clears its API range.
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

  return {
    range: selectionsToRange(
      anchoredDecorations.map((decoration) => decoration.selection),
      value,
    ),
    selection: {
      type: 'text',
      value: anchoredDecorations
        .map((decoration) => decoration.range)
        .sort((a, b) => a._key.localeCompare(b._key)),
    },
  }
}
