import {type Path} from '@sanity/types'

import {type UserListWithPermissionsHookValue} from '../../../hooks'
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
  documentId: string
  documentType: string
  getComment: (id: string) => CommentDocument | undefined
  getCommentLink?: (id: string) => string

  selectedCommentId?: string | undefined
  onClearSelectedComment?: () => void

  isCreatingDataset: boolean

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
    react: CommentOperations['react']
  }

  mentionOptions: UserListWithPermissionsHookValue

  status: CommentStatus
  setStatus: (status: CommentStatus) => void
}
