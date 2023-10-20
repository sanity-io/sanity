import {useCallback, useMemo} from 'react'
import {uuid} from '@sanity/uuid'
import {CurrentUser, SchemaType} from '@sanity/types'
import {SanityClient} from '@sanity/client'
import {
  CommentCreatePayload,
  CommentEditPayload,
  CommentOperations,
  CommentPostPayload,
} from '../types'
import {useNotificationTarget} from './useNotificationTarget'
import {useWorkspace} from 'sanity'
import {useRouterState} from 'sanity/router'

export interface CommentOperationsHookValue {
  operation: CommentOperations
}

export interface CommentOperationsHookOptions {
  client: SanityClient | null

  currentUser: CurrentUser | null
  dataset: string
  documentId: string
  documentType: string
  projectId: string
  schemaType: SchemaType | undefined
  workspace: string

  onCreate?: (comment: CommentPostPayload) => void
  onCreateError: (id: string, error: Error) => void
  onEdit?: (id: string, comment: CommentEditPayload) => void
  onRemove?: (id: string) => void
  onUpdate?: (id: string, comment: Partial<CommentCreatePayload>) => void
}

export function useCommentOperations(
  opts: CommentOperationsHookOptions,
): CommentOperationsHookValue {
  const {
    client,
    currentUser,
    dataset,
    documentId,
    documentType,
    onCreate,
    onCreateError,
    onEdit,
    onRemove,
    onUpdate,
    projectId,
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

      const nextComment = {
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
          notification: getNotificationValue({commentId}),
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
            _type: 'object',
          },
          documentType,
        },
      } satisfies CommentPostPayload

      // We still want to run the `onCreate` callback even if the client is not defined.
      // This is because, if this is the first comment being created, we'll want to
      // handle creation of the client in the `CommentsProvider` and then post the comment.
      onCreate?.(nextComment)

      if (!client) return

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
      onCreate,
      onCreateError,
      projectId,
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
