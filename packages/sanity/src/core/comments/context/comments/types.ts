import {type Path} from '@sanity/types'

import {type UserListWithPermissionsHookValue} from '../../../hooks/useUserListWithPermissions'
import {
  type CommentDocument,
  type CommentOperations,
  type CommentStatus,
  type CommentThreadItem,
} from '../../types'

/**
 * @beta
 * @hidden
 */
export interface CommentsContextValue {
  /**
   * Published / group id used to load comments for this pane.
   */
  documentId: string
  documentType: string
  /**
   * Exact document in the editor. Compared to `target.sourceDocumentId`.
   */
  sourceDocumentId: string
  getComment: (id: string) => CommentDocument | undefined
  getCommentLink?: (id: string) => string

  selectedCommentId?: string | undefined
  onClearSelectedComment?: () => void

  isCommentsOpen?: boolean
  onCommentsOpen?: () => void

  isConnecting?: boolean

  onPathOpen?: (path: Path) => void

  comments: {
    data: {
      open: CommentThreadItem[]
      resolved: CommentThreadItem[]
    }
    error: Error | null
    loading: boolean
  }

  operation: {
    create: CommentOperations['create']
    remove: CommentOperations['remove']
    update: CommentOperations['update']
    updateRange: CommentOperations['updateRange']
    react: CommentOperations['react']
  }

  mentionOptions: UserListWithPermissionsHookValue

  readOnly: boolean
  status: CommentStatus
  setStatus: (status: CommentStatus) => void
}
