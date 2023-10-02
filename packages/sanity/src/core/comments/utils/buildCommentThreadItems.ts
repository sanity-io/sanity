import {SanityDocument} from '@sanity/client'
import {SchemaType, CurrentUser} from '@sanity/types'
import {CommentDocument, CommentThreadItem} from '../types'
import {buildCommentBreadcrumbs} from './buildCommentBreadcrumbs'

const EMPTY_ARRAY: [] = []

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
  const parentComments = comments?.filter((c) => !c.parentCommentId) || EMPTY_ARRAY

  const items = parentComments
    .map((c) => {
      const crumbs = buildCommentBreadcrumbs({
        currentUser,
        documentValue,
        fieldPath: c.target.path.field,
        schemaType,
      })

      const hasInvalidBreadcrumb = crumbs.some((bc) => bc.invalid)

      if (hasInvalidBreadcrumb) return undefined

      const replies = comments?.filter((r) => r.parentCommentId === c._id) || EMPTY_ARRAY

      // Add one to the replies count to account for the parent comment
      const commentsCount = replies.length + 1

      return {
        breadcrumbs: crumbs,
        commentsCount,
        fieldPath: c.target.path.field,
        parentComment: c,
        replies,
        threadId: c.threadId,
      }
    })
    .filter(Boolean) as CommentThreadItem[]

  return items
}
