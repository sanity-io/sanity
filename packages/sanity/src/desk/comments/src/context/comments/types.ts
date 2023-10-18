import {
  CommentDocument,
  CommentOperations,
  CommentStatus,
  CommentThreadItem,
  MentionOptionsHookValue,
} from '../../types'

interface SelectedPathValue {
  /**
   * The path to the field that is selected
   */
  fieldPath: string
  /**
   * The origin of where the path was selected from
   */
  origin: 'inspector' | 'field'
}

export type SelectedPath = SelectedPathValue | null

/**
 * @beta
 * @hidden
 */
export interface CommentsContextValue {
  getComment: (id: string) => CommentDocument | undefined
  getCommentPath: (id: string) => string | null

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

  setSelectedPath: (payload: SelectedPath) => void
  selectedPath: SelectedPath
}
