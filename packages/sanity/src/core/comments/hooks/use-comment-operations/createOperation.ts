import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {uuid} from '@sanity/uuid'

import {type Tool} from '../../../config'
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
  client: SanityClient | null
  comment: CommentCreatePayload
  currentUser: CurrentUser
  dataset: string
  documentId: string
  documentRevisionId?: string
  documentType: string
  documentVersionId?: string
  getComment?: (id: string) => CommentDocument | undefined
  getIntent?: CommentIntentGetter
  getNotificationValue: (comment: {commentId: string}) => CommentContext['notification']
  getThreadLength?: (threadId: string) => number
  onCreate?: (comment: CommentPostPayload) => void
  onCreateError: (id: string, error: Error) => void
  projectId: string
  createAddonDataset: () => Promise<SanityClient | null>
  workspace: string
}

export async function createOperation(props: CreateOperationProps): Promise<void> {
  const {
    activeTool,
    client,
    comment,
    currentUser,
    dataset,
    documentId,
    documentRevisionId,
    documentType,
    documentVersionId,
    getIntent,
    getNotificationValue,
    getThreadLength,
    onCreate,
    onCreateError,
    projectId,
    createAddonDataset,
    workspace,
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
        documentVersionId,
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
        documentVersionId,
      },
    }
  }

  if (!nextComment) return

  onCreate?.(nextComment)

  // If we don't have a client, that means that the dataset doesn't have an addon dataset.
  // Therefore, when the first comment is created, we need to create the addon dataset and create
  // a client for it and then post the comment. We do this here, since we know that we have a
  // comment to create.
  if (!client) {
    try {
      const newAddonClient = await createAddonDataset()
      if (!newAddonClient) {
        throw new Error('Failed to create addon dataset client')
      }
      await newAddonClient.create(nextComment)
    } catch (err) {
      onCreateError?.(nextComment._id, err)
      throw err
    }
    return
  }

  try {
    await client.create(nextComment)
  } catch (err) {
    onCreateError?.(nextComment._id, err)
    throw err
  }
}
