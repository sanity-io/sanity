import {uuid} from '@sanity/uuid'
import {SanityClient} from '@sanity/client'
import {
  CommentContext,
  CommentCreatePayload,
  CommentDocument,
  CommentPostPayload,
} from '../../types'
import {CurrentUser, Tool} from 'sanity'

interface CreateOperationProps {
  activeTool: Tool | undefined
  client: SanityClient | null
  comment: CommentCreatePayload
  currentUser: CurrentUser
  dataset: string
  documentId: string
  documentType: string
  getComment?: (id: string) => CommentDocument | undefined
  getNotificationValue: (comment: {commentId: string}) => CommentContext['notification']
  getThreadLength?: (threadId: string) => number
  onCreate?: (comment: CommentPostPayload) => void
  onCreateError: (id: string, error: Error) => void
  projectId: string
  runSetup: (comment: CommentPostPayload) => Promise<void>
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
    documentType,
    getNotificationValue,
    getThreadLength,
    onCreate,
    onCreateError,
    projectId,
    runSetup,
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

  const nextComment: CommentPostPayload = {
    _id: commentId,
    _type: 'comment',
    authorId,
    lastEditedAt: undefined,
    message: comment.message,
    parentCommentId: comment.parentCommentId,
    status: comment.status,
    threadId: comment.threadId,

    context: {
      payload: {
        workspace,
      },
      notification,
      tool: activeTool?.name || '',
    },

    reactions: [],

    target: {
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

  onCreate?.(nextComment)

  // If we don't have a client, that means that the dataset doesn't have an addon dataset.
  // Therefore, when the first comment is created, we need to create the addon dataset and create
  // a client for it and then post the comment. We do this here, since we know that we have a
  // comment to create.
  if (!client) {
    try {
      await runSetup(nextComment)
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
