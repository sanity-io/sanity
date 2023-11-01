import {useCallback, useMemo} from 'react'
import {uuid} from '@sanity/uuid'
import {CurrentUser, SchemaType} from '@sanity/types'
import {SanityClient} from '@sanity/client'
import {
  CommentContext,
  CommentCreatePayload,
  CommentEditPayload,
  CommentOperations,
  CommentPostPayload,
} from '../types'
import {useNotificationTarget} from './useNotificationTarget'
import {useWorkspace} from 'sanity'
import {useRouterState} from 'sanity/router'

/**
 * @beta
 * @hidden
 */
export interface CommentOperationsHookValue {
  operation: CommentOperations
}

/**
 * @beta
 * @hidden
 */
export interface CommentOperationsHookOptions {
  client: SanityClient | null

  currentUser: CurrentUser | null
  dataset: string
  documentId: string
  documentType: string
  projectId: string
  schemaType: SchemaType | undefined
  workspace: string

  getThreadLength?: (threadId: string) => number

  onCreate?: (comment: CommentPostPayload) => void
  onCreateError: (id: string, error: Error) => void
  onEdit?: (id: string, comment: CommentEditPayload) => void
  onRemove?: (id: string) => void
  onUpdate?: (id: string, comment: Partial<CommentCreatePayload>) => void

  runSetup: (comment: CommentPostPayload) => Promise<void>
}

/**
 * @beta
 * @hidden
 */
export function useCommentOperations(
  opts: CommentOperationsHookOptions,
): CommentOperationsHookValue {
  const {
    client,
    currentUser,
    dataset,
    documentId,
    documentType,
    getThreadLength,
    onCreate,
    onCreateError,
    onEdit,
    onRemove,
    onUpdate,
    projectId,
    runSetup,
    workspace,
  } = opts

  const authorId = currentUser?.id

  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )
  const {tools} = useWorkspace()
  const activeTool = useMemo(
    () => tools.find((tool) => tool.name === activeToolName),
    [activeToolName, tools],
  )
  const {getNotificationValue} = useNotificationTarget({documentId, documentType})

  const handleCreate = useCallback(
    async (comment: CommentCreatePayload) => {
      // The comment payload might already have an id if, for example, the comment was created
      // but the request failed. In that case, we'll reuse the id when retrying to
      // create the comment.
      const commentId = comment?.id || uuid()

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
        authorId: authorId || '', // improve
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
        target: {
          path: {
            field: comment.fieldPath,
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
    },
    [
      activeTool?.name,
      authorId,
      client,
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
    ],
  )

  const handleRemove = useCallback(
    async (id: string) => {
      if (!client) return

      onRemove?.(id)

      await Promise.all([
        client.delete({query: `*[_type == "comment" && parentCommentId == "${id}"]`}),
        client.delete(id),
      ])
    },
    [client, onRemove],
  )

  const handleEdit = useCallback(
    async (id: string, comment: CommentEditPayload) => {
      if (!client) return

      const editedComment = {
        message: comment.message,
        lastEditedAt: new Date().toISOString(),
      } satisfies CommentEditPayload

      onEdit?.(id, editedComment)

      await client.patch(id).set(editedComment).commit()
    },
    [client, onEdit],
  )

  const handleUpdate = useCallback(
    async (id: string, comment: Partial<CommentCreatePayload>) => {
      if (!client) return

      onUpdate?.(id, comment)

      // If the update contains a status, we'll update the status of all replies
      // to the comment as well.
      if (comment.status) {
        await Promise.all([
          client
            .patch({query: `*[_type == "comment" && parentCommentId == "${id}"]`})
            .set({
              status: comment.status,
            })
            .commit(),
          client.patch(id).set(comment).commit(),
        ])

        return
      }

      // Else we'll just update the comment itself
      await client?.patch(id).set(comment).commit()
    },
    [client, onUpdate],
  )

  const operation = useMemo(
    () => ({
      create: handleCreate,
      edit: handleEdit,
      remove: handleRemove,
      update: handleUpdate,
    }),
    [handleCreate, handleRemove, handleEdit, handleUpdate],
  )

  return {operation}
}
