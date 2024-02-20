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

  isRunningSetup: boolean

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
    edit: CommentOperations['edit']
    remove: CommentOperations['remove']
    update: CommentOperations['update']
    react: CommentOperations['react']
  }

  mentionOptions: UserListWithPermissionsHookValue

  status: CommentStatus
  setStatus: (status: CommentStatus) => void
}
