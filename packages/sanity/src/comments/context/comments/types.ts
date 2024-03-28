import {type UserListWithPermissionsHookValue} from 'sanity'

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
  getComment: (id: string) => CommentDocument | undefined

  isCreatingDataset: boolean

  isCommentsOpen?: boolean
  onCommentsOpen?: () => void

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
