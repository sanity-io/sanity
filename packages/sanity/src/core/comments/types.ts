import {PortableTextBlock, User} from '@sanity/types'
import {CommentOperations, MentionOptionsHookValue} from './hooks'

/**
 * @beta
 * @hidden
 */
export interface Loadable<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

/**
 * @beta
 * @hidden
 */
export interface MentionOptionUser extends User {
  canBeMentioned: boolean
}

/**
 * @beta
 * @hidden
 */
export interface CommentThreadItem {
  breadcrumbs: CommentBreadcrumbs
  commentsCount: number
  fieldPath: string
  parentComment: CommentDocument
  replies: CommentDocument[]
  threadId: string
}

/**
 * @beta
 * @hidden
 */
export interface CommentsContextValue {
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

/**
 * @beta
 * @hidden
 */
export type CommentMessage = PortableTextBlock[] | null

/**
 * @beta
 * @hidden
 */
export type CommentStatus = 'open' | 'resolved'

/**
 * @beta
 * @hidden
 */
export interface CommentPath {
  field: string
}

interface CommentContext {
  tool: string
  payload?: Record<string, unknown>
  notification: {
    title: string
    url: string
  }
}

/**
 * @beta
 * @hidden
 */
export interface CommentDocument {
  _type: 'comment'
  _createdAt: string
  _updatedAt: string
  _id: string
  _rev: string

  authorId: string

  message: CommentMessage

  threadId: string

  parentCommentId?: string

  status: CommentStatus

  lastEditedAt?: string

  context?: CommentContext

  target: {
    path: CommentPath
    documentType: string

    document: {
      _dataset: string
      _projectId: string // verify
      _ref: string
      _type: 'crossDatasetReference'
      _weak: true
    }
  }
}

/**
 * @beta
 * @hidden
 */
export type CommentPostPayload = Omit<CommentDocument, '_rev' | '_createdAt' | '_updatedAt'>

/**
 * @beta
 * @hidden
 */
export interface CommentCreatePayload {
  message: CommentMessage
  status: CommentStatus
  fieldPath: string
  parentCommentId: string | undefined
  threadId: string
}

/**
 * @beta
 * @hidden
 */
export type CommentEditPayload = {
  message: CommentMessage
  lastEditedAt?: string
}

/**
 * @beta
 * @hidden
 */
export interface CommentsListBreadcrumbItem {
  invalid: boolean
  isArrayItem?: boolean
  title: string
}

/**
 * @beta
 * @hidden
 */
export type CommentBreadcrumbs = CommentsListBreadcrumbItem[]
