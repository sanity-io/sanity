import {useCallback, useMemo} from 'react'
import {uuid} from '@sanity/uuid'
import {CurrentUser, SchemaType} from '@sanity/types'
import {CommentCreatePayload, CommentEditPayload, CommentPostPayload} from '../types'
import {useCommentsClient} from './useCommentsClient'
import {useNotificationTarget} from './useNotificationTarget'

export interface CommentOperations {
  create: (comment: CommentCreatePayload) => Promise<void>
  edit: (id: string, comment: CommentEditPayload) => Promise<void>
  remove: (id: string) => Promise<void>
  update: (id: string, comment: Partial<CommentCreatePayload>) => Promise<void>
}

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
    onEdit,
    onRemove,
    onUpdate,
    projectId,
    workspace,
  } = opts || {}
  const client = useCommentsClient()

  const authorId = currentUser?.id

  const {title, url, toolName} = useNotificationTarget({
    documentId,
    documentType,
  })

  const handleCreate = useCallback(
    async (comment: CommentCreatePayload) => {
      const nextComment = {
        _id: uuid(),
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

      await client.create(nextComment)
    },
    [
      authorId,
      client,
      dataset,
      documentId,
      documentType,
      onCreate,
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

      await client.patch(id).set(comment).commit()
    },
    [client, onUpdate],
  )

  const operation = useMemo(
    () => ({
      create: handleCreate,
      update: handleUpdate,
      remove: handleRemove,
      edit: handleEdit,
    }),
    [handleCreate, handleRemove, handleEdit, handleUpdate],
  )

  return {operation}
}
