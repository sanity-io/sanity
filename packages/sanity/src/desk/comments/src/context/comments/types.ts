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

  comments: {
    data: {
      open: CommentThreadItem[]
      resolved: CommentThreadItem[]
    }
    error: Error | null
    loading: boolean
  }

  remove: {
    execute: CommentOperations['remove']
  }

  create: {
    execute: CommentOperations['create']
  }

  edit: {
    execute: CommentOperations['edit']
  }

  update: {
    execute: CommentOperations['update']
  }

  mentionOptions: MentionOptionsHookValue

  status: CommentStatus
  setStatus: (status: CommentStatus) => void
}
