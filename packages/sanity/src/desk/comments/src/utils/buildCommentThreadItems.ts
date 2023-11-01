import {SanityDocument} from '@sanity/client'
import {SchemaType, CurrentUser} from '@sanity/types'
import {CommentDocument, CommentThreadItem} from '../types'
import {buildCommentBreadcrumbs} from './buildCommentBreadcrumbs'

interface BuildCommentThreadItemsProps {
  comments: CommentDocument[]
  currentUser: CurrentUser
  documentValue: Partial<SanityDocument> | null
  schemaType: SchemaType
}

/**
 * @beta
 * @hidden
 *
 * This function formats comments into a structure that is easier to work with in the UI.
 * It also validates each comment against the document value and schema type to ensure
 * that the comment is valid. If the comment is invalid, it will be omitted from the
 * returned array.
 */
export function buildCommentThreadItems(props: BuildCommentThreadItemsProps): CommentThreadItem[] {
  const {comments, currentUser, documentValue, schemaType} = props
  const parentComments = comments?.filter((c) => !c.parentCommentId)

  const items = parentComments
    .map((parentComment) => {
      const crumbs = buildCommentBreadcrumbs({
        currentUser,
        documentValue,
        fieldPath: parentComment.target.path.field,
        schemaType,
      })

      const hasInvalidBreadcrumb = crumbs.some((bc) => bc.invalid)

      if (hasInvalidBreadcrumb) return undefined

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
    .filter(Boolean) as CommentThreadItem[]

  return items
}
