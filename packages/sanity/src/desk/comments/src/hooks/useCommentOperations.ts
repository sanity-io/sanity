import {useCallback, useMemo} from 'react'
import {uuid} from '@sanity/uuid'
import {CurrentUser, SchemaType} from '@sanity/types'
import {
  CommentCreatePayload,
  CommentEditPayload,
  CommentOperations,
  CommentPostPayload,
} from '../types'
import {useCommentsClient} from './useCommentsClient'
import {useNotificationTarget} from './useNotificationTarget'

export interface CommentOperationsHookValue {
  operation: CommentOperations
}

interface CommentOperationsHookOptions {
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
  const client = useCommentsClient()

  const authorId = currentUser?.id

  const {title, url, toolName} = useNotificationTarget({
    documentId,
    documentType,
  })

  const handleCreate = useCallback(
    async (comment: CommentCreatePayload) => {
      const nextComment = {
        // The comment payload might already have an id if, for example, the comment was created
        // but the request failed. In that case, we'll reuse the id when retrying to
        // create the comment.
        _id: comment?.id || uuid(),
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
          notification: {title, url},
          tool: toolName,
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
      } satisfies CommentPostPayload

      onCreate?.(nextComment)

      try {
        await client.create(nextComment)
      } catch (err) {
        onCreateError?.(nextComment._id, err)

        throw err
      }
    },
    [
      authorId,
      client,
      dataset,
      documentId,
      documentType,
      onCreate,
      onCreateError,
      projectId,
      title,
      toolName,
      url,
      workspace,
    ],
  )

  const handleRemove = useCallback(
    async (id: string) => {
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
      await client.patch(id).set(comment).commit()
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
