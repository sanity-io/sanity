import {type CurrentUser, type SchemaType} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useCallback, useMemo} from 'react'
import {useAddonDatasetStore} from 'sanity'
import {useRouterState} from 'sanity/router'

import {useTools} from '../../../hooks'
import {
  type CommentCreatePayload,
  type CommentDocument,
  type CommentOperations,
  type CommentPostPayload,
  type CommentReactionOption,
  type CommentUpdateOperationOptions,
  type CommentUpdatePayload,
} from '../../types'
import {useCommentsIntent} from '../useCommentsIntent'
import {useNotificationTarget} from '../useNotificationTarget'
import {createOperation} from './createOperation'
import {reactOperation} from './reactOperation'
import {removeOperation} from './removeOperation'
import {updateOperation} from './updateOperation'

export interface CommentOperationsHookValue {
  operation: CommentOperations
}

export interface CommentOperationsHookOptions {
  currentUser: CurrentUser | null
  dataset: string
  documentId: string
  documentRevisionId?: string
  documentType: string
  getComment?: (id: string) => CommentDocument | undefined
  getThreadLength?: (threadId: string) => number
  onCreate?: (comment: CommentPostPayload) => void
  onCreateError: (id: string, error: Error) => void
  onRemove?: (id: string) => void
  onTransactionStart: (commentDocumentId: string, transactionId: string) => void
  onUpdate?: (id: string, comment: CommentUpdatePayload) => void
  projectId: string
  schemaType: SchemaType | undefined
  workspace: string
  getCommentLink?: (commentId: string) => string
}

export function useCommentOperations(
  opts: CommentOperationsHookOptions,
): CommentOperationsHookValue {
  const {
    currentUser,
    dataset,
    documentId,
    documentRevisionId,
    documentType,
    getComment,
    getThreadLength,
    onCreate,
    onCreateError,
    onRemove,
    onTransactionStart,
    onUpdate,
    projectId,
    workspace,
    getCommentLink,
  } = opts

  const getIntent = useCommentsIntent()

  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )
  const tools = useTools()

  const activeTool = useMemo(
    () => tools.find((tool) => tool.name === activeToolName),
    [activeToolName, tools],
  )
  const {getNotificationValue} = useNotificationTarget({documentId, documentType, getCommentLink})

  const addonDatasetStore = useAddonDatasetStore()

  const handleCreate = useCallback(
    async (comment: CommentCreatePayload) => {
      if (!currentUser?.id) return

      await createOperation({
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
      })
    },
    [
      activeTool,
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
    ],
  )

  const handleRemove = useCallback(
    async (id: string) => {
      await removeOperation({
        id,
        onRemove,
        addonDatasetStore,
      })
    },
    [addonDatasetStore, onRemove],
  )

  const handleUpdate = useCallback(
    async (
      id: string,
      comment: CommentUpdatePayload,
      updateOpts?: CommentUpdateOperationOptions,
    ) => {
      const {throttled} = updateOpts || {}

      // Generate a new transaction ID to use for the update operation transaction
      const nextTransactionId = uuid()

      // Pass the ID of the comment document and the new transaction ID to the
      // onTransactionStart callback. This is used by consumers to track the
      // transaction state of the comment document. That is, when a real time
      // listener event is received, the consumer can check if the received
      // transaction ID is the latest for the received comment ID and determine
      // whether the result in the real time event should be used to update the
      // comment state or not.
      onTransactionStart(id, nextTransactionId)

      await updateOperation({
        comment,
        throttled,
        id,
        onUpdate,
        transactionId: nextTransactionId,
        addonDatasetStore,
      })
    },
    [addonDatasetStore, onTransactionStart, onUpdate],
  )

  const handleReact = useCallback(
    async (id: string, reaction: CommentReactionOption) => {
      if (!currentUser?.id) return

      await reactOperation({
        currentUser,
        id,
        reaction,
        getComment,
        onUpdate,
        addonDatasetStore,
      })
    },
    [addonDatasetStore, currentUser, getComment, onUpdate],
  )

  return useMemo(
    () => ({
      operation: {
        create: handleCreate,
        react: handleReact,
        remove: handleRemove,
        update: handleUpdate,
      } satisfies CommentOperations,
    }),
    [handleCreate, handleRemove, handleUpdate, handleReact],
  )
}
