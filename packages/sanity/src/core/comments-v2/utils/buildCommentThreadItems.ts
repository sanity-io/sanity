import {type SanityDocument} from '@sanity/client'
import {type CurrentUser, type SchemaType} from '@sanity/types'

import {isTextSelectionComment} from '../helpers'
import {type CommentDocument, type CommentThreadItem} from '../types'
import {buildCommentBreadcrumbs} from './buildCommentBreadcrumbs'
import {COMMENT_INDICATORS} from './inline-comments/buildRangeDecorationSelectionsFromComments'

/**
 * Whether a stored selection item still marks a non-empty text fragment.
 *
 * Each item holds the block's full text with the selected fragment wrapped in
 * marker characters (`before\uF000selected\uF001after`), so the string itself
 * is non-empty even when the selection has collapsed to nothing — only the
 * content *between* the markers tells us whether any text is still selected.
 */
function hasMarkedFragment(text: string): boolean {
  const startIndex = text.indexOf(COMMENT_INDICATORS[0])
  const endIndex = text.indexOf(COMMENT_INDICATORS[1])

  // No markers present: fall back to treating any non-empty text as a
  // selection (legacy comments stored an empty string when de-anchored).
  if (startIndex === -1 || endIndex === -1) return Boolean(text)

  return endIndex > startIndex + 1
}

const EMPTY_ARRAY: [] = []

type BuildCommentThreadItemsProps =
  | {
      comments: CommentDocument[]
      currentUser: CurrentUser
      documentValue: Partial<SanityDocument> | null
      schemaType: SchemaType
      type: 'field'
    }
  | {
      schemaType?: undefined
      comments: CommentDocument[]
      currentUser: CurrentUser
      documentValue: Partial<SanityDocument> | null
      type: 'task'
    }

/**
 * This function formats comments into a structure that is easier to work with in the UI.
 * It also validates each comment against the document value and schema type to ensure
 * that the comment is valid. If the comment is invalid, it will be omitted from the
 * returned array.
 */
export function buildCommentThreadItems(props: BuildCommentThreadItemsProps): CommentThreadItem[] {
  const {comments, currentUser, documentValue, schemaType, type} = props
  const parentComments = comments?.filter((c) => !c.parentCommentId)

  // If the comments are "task" comments, just group them together as thread items
  // without any validation of the comments.
  if (type === 'task') {
    const taskCommentItems = parentComments.map((parentComment) => {
      const replies = comments?.filter((r) => r.parentCommentId === parentComment._id)
      const commentsCount = [parentComment, ...replies].length
      const hasReferencedValue = false

      const item: CommentThreadItem = {
        commentsCount,
        parentComment,
        replies,
        threadId: parentComment.threadId,
        hasReferencedValue,
        breadcrumbs: EMPTY_ARRAY,
        fieldPath: '',
      }

      return item
    })

    return taskCommentItems
  }

  // If the comments are "field" comments, we want to validate them against
  // the document value and schema type.
  if (type === 'field') {
    const fieldCommentItems = parentComments.map((parentComment) => {
      const crumbs = buildCommentBreadcrumbs({
        currentUser,
        documentValue,
        fieldPath: parentComment.target.path?.field || '',
        schemaType,
      })

      let hasTextSelection = false

      // A text selection comment still references its value when at least one
      // of its selection items marks a non-empty fragment. A comment whose
      // selection was removed (`range: null`) is not a text selection comment
      // at all and shows as unlinked via `hasReferencedValue: false`.
      if (isTextSelectionComment(parentComment)) {
        hasTextSelection = Boolean(
          parentComment.target.path?.selection &&
          parentComment.target.path.selection.value.some((v) => hasMarkedFragment(v.text)),
        )
      }

      // Check if the comment has an invalid breadcrumb. The breadcrumbs can be invalid if:
      // - The field is hidden by conditional fields
      // - The field is not found in the schema type
      // - The field is not found in the document value (array items only)
      const hasInvalidBreadcrumb = crumbs.some((bc) => bc.invalid)

      // If the comment has an invalid breadcrumb or selection, we will omit it from the list.
      if (hasInvalidBreadcrumb) return undefined

      const replies = comments?.filter((r) => r.parentCommentId === parentComment._id)
      const commentsCount = [parentComment, ...replies].length
      const hasReferencedValue = hasTextSelection

      const item: CommentThreadItem = {
        breadcrumbs: crumbs,
        commentsCount,
        fieldPath: parentComment.target.path?.field || '',
        parentComment,
        replies,
        threadId: parentComment.threadId,
        hasReferencedValue,
      }

      return item
    })

    // We use the `Boolean` function to filter out any `undefined` items from the array.
    return fieldCommentItems.filter(Boolean) as CommentThreadItem[]
  }

  return EMPTY_ARRAY
}
