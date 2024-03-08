import {type SanityDocument} from '@sanity/client'
import {type CurrentUser, type SchemaType} from '@sanity/types'

import {isTextSelectionComment} from '../helpers'
import {type CommentDocument, type CommentsType, type CommentThreadItem} from '../types'
import {buildCommentBreadcrumbs} from './buildCommentBreadcrumbs'

const EMPTY_ARRAY: [] = []

interface BuildCommentThreadItemsProps {
  comments: CommentDocument[]
  currentUser: CurrentUser
  documentValue: Partial<SanityDocument> | null
  schemaType: SchemaType
  type: CommentsType
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

      // NOTE: Keep this code commented out for now as we might want to use it later.
      let hasTextSelection = false

      // If the comment is a text selection comment, we need to make sure that
      // we can successfully build a range decoration selection from it.
      if (isTextSelectionComment(parentComment)) {
        hasTextSelection = Boolean(
          parentComment.target.path?.selection &&
            parentComment.target.path.selection.value.some((v) => v.text),
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
