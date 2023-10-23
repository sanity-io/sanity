import {PortableTextBlock, User} from '@sanity/types'

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
export interface CommentOperations {
  create: (comment: CommentCreatePayload) => Promise<void>
  edit: (id: string, comment: CommentEditPayload) => Promise<void>
  remove: (id: string) => Promise<void>
  update: (id: string, comment: Partial<CommentCreatePayload>) => Promise<void>
}

/**
 * @beta
 * @hidden
 */

export type MentionOptionsHookValue = Loadable<MentionOptionUser[]>

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
  breadcrumbs: CommentListBreadcrumbs
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

/**
 * @beta
 * @hidden
 */
export interface CommentContext {
  tool: string
  payload?: Record<string, unknown>
  notification?: {
    documentTitle: string
    url: string
    workspaceTitle: string
  }
}

interface CommentCreateRetryingState {
  type: 'createRetrying'
}

interface CommentCreateFailedState {
  type: 'createError'
  error: Error
}

/**
 * The state is used to track the state of the comment (e.g. if it failed to be created, etc.)
 * It is a local value and is not stored on the server.
 * When there's no state, the comment is considered to be in a "normal" state (e.g. created successfully).
 *
 * The state value is primarily used to update the UI. That is, to show an error message or retry button.
 */
type CommentState = CommentCreateFailedState | CommentCreateRetryingState | undefined

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

  _state?: CommentState

  target: {
    path: CommentPath
    documentType: string
    document: {
      _dataset: string
      _projectId: string
      _ref: string
      _type: 'crossDatasetReference'
      _weak: boolean
    }
  }
}

/**
 * @beta
 * @hidden
 */
export type CommentPostPayload = Omit<CommentDocument, '_rev' | '_updatedAt' | '_createdAt'>

/**
 * @beta
 * @hidden
 */
export interface CommentCreatePayload {
  fieldPath: string
  id?: string
  message: CommentMessage
  parentCommentId: string | undefined
  status: CommentStatus
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
export type CommentListBreadcrumbs = CommentsListBreadcrumbItem[]
