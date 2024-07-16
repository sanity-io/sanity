import {type CurrentUser} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {filter, switchMap, tap} from 'rxjs'

import {type Tool} from '../../../config'
import {type AddonDatasetStore} from '../../../studio'
import {
  type CommentContext,
  type CommentCreatePayload,
  type CommentDocument,
  type CommentIntentGetter,
  type CommentPostPayload,
} from '../../types'
import {weakenReferencesInContentSnapshot} from '../../utils'

interface CreateOperationProps {
  activeTool: Tool | undefined
  comment: CommentCreatePayload
  currentUser: CurrentUser
  dataset: string
  documentId: string
  documentRevisionId?: string
  documentType: string
  getComment?: (id: string) => CommentDocument | undefined
  getIntent?: CommentIntentGetter
  getNotificationValue: (comment: {commentId: string}) => CommentContext['notification']
  getThreadLength?: (threadId: string) => number
  onCreate?: (comment: CommentPostPayload) => void
  onCreateError: (id: string, error: Error) => void
  projectId: string
  workspace: string
  addonDatasetStore: AddonDatasetStore
}

export async function createOperation(props: CreateOperationProps): Promise<void> {
  const {
    activeTool,
    comment,
    currentUser,
    dataset,
    documentId,
    documentRevisionId,
    documentType,
    getIntent,
    getNotificationValue,
    getThreadLength,
    onCreate,
    onCreateError,
    projectId,
    workspace,
    addonDatasetStore,
  } = props

  // The comment payload might already have an id if, for example, the comment was created
  // but the request failed. In that case, we'll reuse the id when retrying to
  // create the comment.
  const commentId = comment?.id || uuid()
  const authorId = currentUser.id

  // Get the current thread length of the thread the comment is being added to.
  // We add 1 to the length to account for the comment being added.
  const currentThreadLength = (getThreadLength?.(comment.threadId) || 0) + 1

  let nextComment: CommentPostPayload | undefined

  if (comment.type === 'task') {
    nextComment = {
      _id: commentId,
      _type: 'comment',
      authorId,
      message: comment.message,
      lastEditedAt: undefined,
      parentCommentId: comment.parentCommentId,
      status: comment.status,
      threadId: comment.threadId,
      reactions: comment.reactions,

      context: {
        payload: {
          workspace,
        },
        notification: comment.context.notification,
        tool: activeTool?.name || '',
      },

      target: {
        document: {
          _ref: documentId,
          _type: 'reference',
          _weak: true,
        },
        documentType,
      },
    }
  }

  if (comment.type === 'field') {
    const {
      documentTitle = '',
      url = '',
      workspaceTitle = '',
    } = getNotificationValue({commentId}) || {}

    const notification: CommentContext['notification'] = {
      currentThreadLength,
      documentTitle,
      url,
      workspaceTitle,
    }

    const intent = getIntent?.({id: documentId, type: documentType, path: comment.fieldPath})

    // If the content snapshot contains a reference, we need to weaken it.
    // This prevents Content Lake from validating the references, which could,
    // for example, prevent the deletion of the document that the reference
    // in the content snapshot points to.
    const contentSnapshot = weakenReferencesInContentSnapshot(comment.contentSnapshot)

    nextComment = {
      _id: commentId,
      _type: 'comment',
      authorId,
      message: comment.message,
      lastEditedAt: undefined,
      parentCommentId: comment.parentCommentId,
      status: comment.status,
      threadId: comment.threadId,
      reactions: comment.reactions,

      context: {
        payload: {
          workspace,
        },
        intent,
        notification,
        tool: activeTool?.name || '',
      },

      contentSnapshot,

      target: {
        documentRevisionId: documentRevisionId || '',

        path: {
          field: comment.fieldPath,
          selection: comment.selection,
        },
        document: {
          _dataset: dataset,
          _projectId: projectId,
          _ref: documentId,
          _type: 'crossDatasetReference',
          _weak: true,
        },
        documentType,
      },
    }
  }

  if (!nextComment) return

  onCreate?.(nextComment)

  addonDatasetStore.client$
    .pipe(
      filter((clientStore) => clientStore.state === 'ready'),
      switchMap(({client}) => client.observable.create(nextComment)),
      tap({
        error: (error) => onCreateError?.(nextComment._id, error),
      }),
    )
    .subscribe()
}
