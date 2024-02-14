import {type PortableTextBlock} from '@sanity/types'
import {type IntentParameters} from 'sanity/router'

/**
 * @beta
 * @hidden
 */
export interface Loadable<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

export interface CommentUpdateOperationOptions {
  throttle: boolean
}

/**
 * @beta
 * @hidden
 */
export interface CommentOperations {
  create: (comment: CommentCreatePayload) => Promise<void>
  react: (id: string, reaction: CommentReactionOption) => Promise<void>
  remove: (id: string) => Promise<void>
  update: (
    id: string,
    comment: CommentUpdatePayload,
    opts?: CommentUpdateOperationOptions,
  ) => Promise<void>
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
  selection: CommentPathSelection | undefined
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

export interface CommentTextSelection {
  type: 'text'
  value: {
    _key: string
    text: string
  }[]
}

type CommentPathSelection = CommentTextSelection

/**
 * @beta
 * @hidden
 */
export interface CommentPath {
  field: string
  selection?: CommentPathSelection
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
    currentThreadLength?: number
  }
  intent?: {
    title: string
    name: string
    params: IntentParameters
  }
}

/**
 * @beta
 * @hidden
 */
export type CommentIntentGetter = (comment: {
  id: string
  type: string
  path: string
}) => CommentContext['intent']

interface CommentCreateRetryingState {
  type: 'createRetrying'
}

interface CommentCreateFailedState {
  type: 'createError'
  error: Error
}

/**
 * @beta
 * @hidden
 * The short names for the comment reactions.
 * We follow the convention for short names outlined in https://projects.iamcal.com/emoji-data/table.htm.
 */
export type CommentReactionShortNames =
  | ':-1:'
  | ':+1:'
  | ':eyes:'
  | ':heart:'
  | ':heavy_plus_sign:'
  | ':rocket:'

/**
 * @beta
 * @hidden
 */
export interface CommentReactionOption {
  shortName: CommentReactionShortNames
  title: string
}

/**
 * @beta
 * @hidden
 */
export interface CommentReactionItem {
  _key: string
  shortName: CommentReactionShortNames
  userId: string
  addedAt: string

  /**
   * This is a local value and is not stored on the server.
   * It is used to track the optimistic state of the reaction.
   */
  _optimisticState?: 'added' | 'removed'
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
  _id: string
  _rev: string

  _state?: CommentState

  authorId: string
  message: CommentMessage
  threadId: string
  parentCommentId?: string
  status: CommentStatus
  lastEditedAt?: string
  reactions: CommentReactionItem[] | null
  context?: CommentContext

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
  selection?: CommentPathSelection
  status: CommentStatus
  threadId: string
  reactions: CommentReactionItem[]
}

/**
 * @beta
 * @hidden
 */
export type CommentUpdatePayload = Partial<Omit<CommentPostPayload, '_id' | '_type'>>

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

export interface CommentsUpsellData {
  _createdAt: string
  _id: string
  _rev: string
  _type: string
  _updatedAt: string
  id: string
  image: {
    asset: {
      url: string
      altText: string | null
    }
  }
  descriptionText: PortableTextBlock[]
  ctaButton: {
    text: string
    url: string
  }
  secondaryButton: {
    url: string
    text: string
  }
}

export type CommentsUIMode = 'default' | 'upsell'
