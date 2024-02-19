import {type SanityDocument} from '@sanity/client'
import {type CurrentUser, type SchemaType} from '@sanity/types'

import {type CommentDocument, type CommentThreadItem} from '../types'
import {buildCommentBreadcrumbs} from './buildCommentBreadcrumbs'

// const EMPTY_ARRAY: [] = []

interface BuildCommentThreadItemsProps {
  comments: CommentDocument[]
  currentUser: CurrentUser
  documentValue: Partial<SanityDocument> | null
  schemaType: SchemaType
}

/**
 * This function formats comments into a structure that is easier to work with in the UI.
 * It also validates each comment against the document value and schema type to ensure
 * that the comment is valid. If the comment is invalid, it will be omitted from the
 * returned array.
 */
export function buildCommentThreadItems(props: BuildCommentThreadItemsProps): CommentThreadItem[] {
  const {comments, currentUser, documentValue, schemaType} = props
  const parentComments = comments?.filter((c) => !c.parentCommentId)

  const items = parentComments.map((parentComment) => {
    const crumbs = buildCommentBreadcrumbs({
      currentUser,
      documentValue,
      fieldPath: parentComment.target.path.field,
      schemaType,
    })

    // NOTE: Keep this code commented out for now as we might want to use it later.
    // let hasValidTextSelection = false

    // // If the comment is a text selection comment, we need to make sure that
    // // we can successfully build a range decoration selection from it.
    // // This is important as we don't want to include comments in the the list that
    // // has no reference to the document value.
    // // If we are unable to build a selection, we will omit the comment from the list.
    // // The selection will fail to be built if the text that the comment is targeting
    // // has been removed or been modified to an extent that the matching algorithm
    // // cannot find the correct range in the document value.
    // if (isTextSelectionComment(parentComment)) {
    //   // Get the value of the field that the comment is targeting
    //   // to validate the selection against it.
    //   const value = getValueAtPath(
    //     documentValue,
    //     PathUtils.fromString(parentComment.target.path.field),
    //   )

    //   // Validate the comment against the document value
    //   const isValid = validateTextSelectionComment({
    //     comment: parentComment,
    //     value: (value || EMPTY_ARRAY) as PortableTextBlock[],
    //   })

    //   hasValidTextSelection = isValid
    // }

    // Check if the comment has an invalid breadcrumb. The breadcrumbs can be invalid if:
    // - The field is hidden by conditional fields
    // - The field is not found in the schema type
    // - The field is not found in the document value (array items only)
    const hasInvalidBreadcrumb = crumbs.some((bc) => bc.invalid)

    // If the comment has an invalid breadcrumb or selection, we will omit it from the list.
    if (hasInvalidBreadcrumb) return undefined
    // if (!hasValidTextSelection) return undefined

    const replies = comments?.filter((r) => r.parentCommentId === parentComment._id)

    const commentsCount = [parentComment, ...replies].length

    return {
      breadcrumbs: crumbs,
      commentsCount,
      fieldPath: parentComment.target.path.field,
      parentComment,
      replies,
      threadId: parentComment.threadId,
    }
  })

  // We use the `Boolean` function to filter out any `undefined` items from the array.
  return items.filter(Boolean) as CommentThreadItem[]
}
