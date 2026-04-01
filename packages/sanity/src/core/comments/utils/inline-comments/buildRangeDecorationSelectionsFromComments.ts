import {type RangeDecoration} from '@portabletext/editor'
import {type PortableTextBlock} from '@sanity/types'

import {type CommentDocument, type CommentRangeEntry} from '../../types'
import {
  commentRangeEntryToRange,
  isZeroLengthSelection,
  rangeToEditorSelection,
} from './commentRange'

const EMPTY_ARRAY: [] = []

/**
 * @internal
 */
export interface BuildCommentsRangeDecorationsProps {
  value: PortableTextBlock[] | undefined
  comments: CommentDocument[]
  commentRangeEntries: CommentRangeEntry[]
}

/**
 * @internal
 */
export interface BuildCommentsRangeDecorationsResultItem {
  selection: RangeDecoration['selection']
  comment: CommentDocument
}

/**
 * @internal
 */
export interface BuildCommentsRangeDecorationsResult {
  decorations: BuildCommentsRangeDecorationsResultItem[]
  detachedCommentIds: string[]
}

const EMPTY_RESULT: BuildCommentsRangeDecorationsResult = {
  decorations: EMPTY_ARRAY,
  detachedCommentIds: EMPTY_ARRAY,
}

/**
 * Builds range decoration selections from comments by looking up their
 * range data from the document-level `commentRanges` entries.
 *
 * Each comment's `target.path.range` is a string ID that references a
 * `CommentRangeEntry` by `_key`. The actual range positions live on the
 * document, not on the comment.
 *
 * Comments whose range can't be resolved (missing entry, missing block,
 * zero-length, or out-of-bounds) are marked as detached.
 * Comments without a stored range ID are ignored (not decorated, not detached).
 * @internal
 */
export function buildRangeDecorationSelectionsFromComments(
  props: BuildCommentsRangeDecorationsProps,
): BuildCommentsRangeDecorationsResult {
  const {value, comments, commentRangeEntries} = props

  if (!value || value.length === 0) return EMPTY_RESULT

  const entriesByKey = new Map<string, CommentRangeEntry>()
  for (const entry of commentRangeEntries) {
    entriesByKey.set(entry._key, entry)
  }

  const decorators: BuildCommentsRangeDecorationsResultItem[] = []
  const detachedCommentIds: string[] = []

  for (const comment of comments) {
    const rangeId = comment.target.path?.range
    if (!rangeId) continue

    const entry = entriesByKey.get(rangeId)
    if (!entry) {
      detachedCommentIds.push(comment._id)
      continue
    }

    const storedRange = commentRangeEntryToRange(entry)
    if (!storedRange) {
      detachedCommentIds.push(comment._id)
      continue
    }

    const anchorBlock = value.find((b) => b._key === storedRange.anchor.blockKey)
    const focusBlock = value.find((b) => b._key === storedRange.focus.blockKey)

    const selection = anchorBlock && focusBlock ? rangeToEditorSelection(storedRange, value) : null

    if (!selection || isZeroLengthSelection(selection)) {
      detachedCommentIds.push(comment._id)
      continue
    }

    decorators.push({
      selection,
      comment,
    })
  }

  if (decorators.length === 0 && detachedCommentIds.length === 0) return EMPTY_RESULT
  return {decorations: decorators, detachedCommentIds}
}

export interface BuildCommentRangeDecorationsProps {
  value: PortableTextBlock[] | undefined
  comment: CommentDocument
}

interface ValidateTextSelectionCommentProps {
  comment: CommentDocument
  commentRangeEntries: CommentRangeEntry[]
  value: PortableTextBlock[]
}

export function validateTextSelectionComment(props: ValidateTextSelectionCommentProps): boolean {
  const {comment, commentRangeEntries, value} = props
  if (!comment.target.path?.range) return false

  const result = buildRangeDecorationSelectionsFromComments({
    comments: [comment],
    commentRangeEntries,
    value,
  })

  return result.decorations.length > 0
}
