import {
  CommentDocument,
  CommentOperations,
  CommentStatus,
  CommentThreadItem,
  MentionOptionsHookValue,
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

  mentionOptions: MentionOptionsHookValue

  status: CommentStatus
  setStatus: (status: CommentStatus) => void
  upsellDialogOpen: boolean
  setUpsellDialogOpen: (open: boolean) => void
}
