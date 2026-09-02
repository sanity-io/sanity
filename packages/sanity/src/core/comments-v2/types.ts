import {
  type CollaborationCommentFieldValue,
  type CollaborationCommentRange,
  type CollaborationCommentReactionShortName,
} from '@sanity/client'
import {type PortableTextBlock, type WeakGlobalDocumentReferenceValue} from '@sanity/types'
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

/**
 * @beta
 * @hidden
 */
export interface CommentUpdateOperationOptions {
  throttled: boolean
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
  /**
   * Re-anchors an inline comment after its text has moved.
   * Non-null `range` requires `fieldValue` (editor PT covering the range).
   */
  updateRange: (id: string, payload: CommentUpdateRangePayload) => Promise<void>
}

/**
 * @beta
 * @hidden
 */
export interface CommentThreadItem {
  breadcrumbs: CommentListBreadcrumbs
  commentsCount: number
  fieldPath: string
  hasReferencedValue: boolean
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
export interface CommentsTextSelectionItem {
  _key: string
  text: string
}

/**
 * @beta
 * @hidden
 */
export interface CommentTextSelection {
  type: 'text'
  value: CommentsTextSelectionItem[]
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
    url?: string
    workspaceTitle: string
    workspaceName: string
    currentThreadLength?: number
    // Used in task comments, list of users that are subscribed to the task.
    subscribers?: string[]
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
export type CommentReactionShortNames = CollaborationCommentReactionShortName

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
 * @beta
 * @hidden
 */
export type CommentsType = 'field' | 'task'

/**
 * `updateRange` payload. Non-null `range` requires editor PT as `fieldValue`.
 * `optimisticUpdate` is applied to the local comment while the request is in
 * flight; the listener echo replaces it with the server-resolved state.
 */
export type CommentUpdateRangePayload =
  | {
      range: CollaborationCommentRange
      fieldValue: CollaborationCommentFieldValue
      optimisticUpdate: CommentUpdatePayload
    }
  | {
      range: null
      optimisticUpdate: CommentUpdatePayload
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
 * Comment document as stored by the Comments API (`sanity.comment`).
 *
 * @beta
 * @hidden
 */
export interface CommentDocument {
  _type: 'sanity.comment'
  _createdAt: string
  _id: string
  _rev: string

  /**
   * System metadata. Author is stored in `_system.createdBy`.
   */
  _system: {createdBy: string}

  /**
   * Local-only state used to track optimistic UI updates (e.g. create retrying/failed).
   * Not stored on the server.
   */
  _state?: CommentState

  message: CommentMessage
  threadId: string
  parentCommentId?: string
  status: CommentStatus
  lastEditedAt?: string
  reactions: CommentReactionItem[] | null
  context?: CommentContext

  /**
   * A snapshot value of the content that the comment is related to.
   */
  contentSnapshot?: unknown

  target: {
    path?: CommentPath

    documentRevisionId?: string
    /**
     * The exact document ID the comment was created against (e.g. a draft or version ID).
     */
    sourceDocumentId: string
    documentType: string
    /**
     * Global document reference. `_ref` format: `resourceType:resourceId:publishedDocumentId`
     */
    document: WeakGlobalDocumentReferenceValue
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
export interface CommentBaseCreatePayload {
  id?: CommentDocument['_id']
  message: CommentDocument['message']
  parentCommentId: CommentDocument['parentCommentId']
  reactions: CommentDocument['reactions']
  status: CommentDocument['status']
  threadId: CommentDocument['threadId']

  payload?: {
    fieldPath: string
  }
}

/**
 * @beta
 * @hidden
 */
export interface CommentTaskCreatePayload extends CommentBaseCreatePayload {
  // ...
  type: 'task'
  context: {
    notification: CommentContext['notification']
  }
}

/**
 * @beta
 * @hidden
 */
export type CommentFieldCreatePayload = CommentBaseCreatePayload & {
  type: 'field'
  contentSnapshot?: CommentDocument['contentSnapshot']
  /**
   * The stringified path to the field where the comment was created.
   */
  fieldPath: string
  /**
   * Text selection markers (used for UI rendering).
   */
  selection?: CommentPathSelection
} & (
    | {
        /** Comments API range for an inline selection */
        range: CollaborationCommentRange
        /** Editor Portable Text covering `range` */
        fieldValue: CollaborationCommentFieldValue
      }
    | {
        range?: undefined
        fieldValue?: undefined
      }
  )

/**
 * @beta
 * @hidden
 */
export type CommentCreatePayload = CommentTaskCreatePayload | CommentFieldCreatePayload

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

/**
 * @beta
 * @hidden
 */
export type CommentsUIMode = 'default' | 'upsell'
