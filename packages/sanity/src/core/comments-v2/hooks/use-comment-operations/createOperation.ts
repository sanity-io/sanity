import {type CollaborationCommentCreate, type SanityClient} from '@sanity/client'
import {type CurrentUser, isPortableTextTextBlock} from '@sanity/types'
import {uuid} from '@sanity/uuid'

import {type Tool} from '../../../config/types'
import {
  type CommentContext,
  type CommentCreatePayload,
  type CommentDocument,
  type CommentIntentGetter,
  type CommentPostPayload,
} from '../../types'
import {weakenReferencesInContentSnapshot} from '../../utils/weakenReferencesInContentSnapshot'

interface CreateOperationProps {
  activeTool: Tool | undefined
  client: SanityClient | null
  comment: CommentCreatePayload
  currentUser: CurrentUser
  versionId: string
  documentRevisionId?: string
  documentType: string
  getComment?: (id: string) => CommentDocument | undefined
  getIntent?: CommentIntentGetter
  getNotificationValue: (comment: {commentId: string}) => CommentContext['notification']
  getThreadLength?: (threadId: string) => number
  onCreate?: (comment: CommentPostPayload) => void
  onCreateError: (id: string, error: Error) => void
  workspace: string
}

export async function createOperation(props: CreateOperationProps): Promise<void> {
  const {
    activeTool,
    client,
    comment,
    currentUser,
    versionId,
    documentRevisionId,
    documentType,
    getIntent,
    getNotificationValue,
    getThreadLength,
    onCreate,
    onCreateError,
    workspace,
  } = props

  if (!client || !comment.message) return

  // Comments are authored by the global user, which some sessions don't have.
  const authorId = currentUser.sanityUserId
  if (!authorId) return

  // The comment payload might already have an id if, for example, the comment was created
  // but the request failed. In that case, we'll reuse the id when retrying to
  // create the comment.
  const commentId = comment?.id || uuid()

  // Get the current thread length of the thread the comment is being added to.
  // We add 1 to the length to account for the comment being added.
  const currentThreadLength = (getThreadLength?.(comment.threadId) || 0) + 1

  const gdr = client.collaboration.comments.getTargetDocumentRef(versionId)

  // The Comments API only accepts text blocks; comment messages never hold
  // block-level inline objects.
  const apiMessage = comment.message.filter(isPortableTextTextBlock)

  let nextComment: CommentPostPayload | undefined
  let apiPayload: CollaborationCommentCreate | undefined

  if (comment.type === 'task') {
    nextComment = {
      _id: commentId,
      _type: 'sanity.comment',
      _system: {createdBy: authorId},
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
          _ref: gdr,
          _type: 'globalDocumentReference',
          _weak: true,
        },
        sourceDocumentId: versionId,
        documentType,
      },
    }

    apiPayload = comment.parentCommentId
      ? {
          _id: commentId,
          message: apiMessage,
          parentCommentId: comment.parentCommentId,
          context: {...nextComment.context},
        }
      : {
          _id: commentId,
          message: apiMessage,
          threadId: comment.threadId,
          context: {...nextComment.context},
          target: {documentId: versionId, documentType},
        }
  }

  if (comment.type === 'field') {
    const {
      documentTitle = '',
      url = '',
      workspaceTitle = '',
      workspaceName = '',
    } = getNotificationValue({commentId}) || {}

    const notification: CommentContext['notification'] = {
      currentThreadLength,
      documentTitle,
      url,
      workspaceTitle,
      workspaceName,
    }

    const intent = getIntent?.({
      id: versionId,
      type: documentType,
      path: comment.fieldPath,
    })

    // If the content snapshot contains a reference, we need to weaken it.
    // This prevents Content Lake from validating the references, which could,
    // for example, prevent the deletion of the document that the reference
    // in the content snapshot points to.
    const contentSnapshot = weakenReferencesInContentSnapshot(comment.contentSnapshot)

    nextComment = {
      _id: commentId,
      _type: 'sanity.comment',
      _system: {createdBy: authorId},
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
          _ref: gdr,
          _type: 'globalDocumentReference',
          _weak: true,
        },
        documentType,
        sourceDocumentId: versionId,
      },
    }

    const target = {
      documentId: versionId,
      documentType,
      documentRevisionId,
      path: comment.fieldPath,
    }

    apiPayload = comment.parentCommentId
      ? {
          _id: commentId,
          message: apiMessage,
          parentCommentId: comment.parentCommentId,
          context: {...nextComment.context},
        }
      : {
          _id: commentId,
          message: apiMessage,
          threadId: comment.threadId,
          context: {...nextComment.context},
          target: comment.range
            ? {...target, range: comment.range, fieldValue: comment.fieldValue}
            : target,
        }
  }

  if (!nextComment || !apiPayload) return

  onCreate?.(nextComment)

  try {
    await client.collaboration.comments.create(apiPayload)
  } catch (err) {
    onCreateError?.(nextComment._id, err)
    throw err
  }
}
