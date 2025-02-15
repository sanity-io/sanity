import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type SchemaType} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useCallback, useMemo} from 'react'
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
  client: SanityClient | null
  currentUser: CurrentUser | null
  dataset: string
  documentId: string
  documentRevisionId?: string
  documentType: string
  documentVersionId?: string
  getComment?: (id: string) => CommentDocument | undefined
  getThreadLength?: (threadId: string) => number
  onCreate?: (comment: CommentPostPayload) => void
  onCreateError: (id: string, error: Error) => void
  onRemove?: (id: string) => void
  onTransactionStart: (commentDocumentId: string, transactionId: string) => void
  onUpdate?: (id: string, comment: CommentUpdatePayload) => void
  projectId: string
  createAddonDataset: () => Promise<SanityClient | null>
  schemaType: SchemaType | undefined
  workspace: string
  getCommentLink?: (commentId: string) => string
}

export function useCommentOperations(
  opts: CommentOperationsHookOptions,
): CommentOperationsHookValue {
  const {
    client,
    currentUser,
    dataset,
    documentId,
    documentRevisionId,
    documentType,
    documentVersionId,
    getComment,
    getThreadLength,
    onCreate,
    onCreateError,
    onRemove,
    onTransactionStart,
    onUpdate,
    projectId,
    createAddonDataset,
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

  const handleCreate = useCallback(
    async (comment: CommentCreatePayload) => {
      // Unlike the other operations, we want to proceed with create operation even
      // though there is no client available. This is because if there is no client for the
      // comments addon dataset, it will be created in the `createOperation`, and the
      // comment will be created in that dataset when the client is eventually created.
      if (!currentUser?.id) return

      await createOperation({
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
      })
    },
    [
      activeTool,
      client,
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
    ],
  )

  const handleRemove = useCallback(
    async (id: string) => {
      if (!client) return

      await removeOperation({
        client,
        id,
        onRemove,
      })
    },
    [client, onRemove],
  )

  const handleUpdate = useCallback(
    async (
      id: string,
      comment: CommentUpdatePayload,
      updateOpts?: CommentUpdateOperationOptions,
    ) => {
      if (!client) return
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
        client,
        comment,
        throttled,
        id,
        onUpdate,
        transactionId: nextTransactionId,
      })
    },
    [client, onTransactionStart, onUpdate],
  )

  const handleReact = useCallback(
    async (id: string, reaction: CommentReactionOption) => {
      if (!client || !currentUser?.id) return

      await reactOperation({
        client,
        currentUser,
        id,
        reaction,
        getComment,
        onUpdate,
      })
    },
    [client, currentUser, getComment, onUpdate],
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
