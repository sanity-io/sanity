import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type SchemaType} from '@sanity/types'
import {useCallback, useMemo} from 'react'
import {useWorkspace} from 'sanity'
import {useRouterState} from 'sanity/router'

import {
  type CommentCreatePayload,
  type CommentDocument,
  type CommentEditPayload,
  type CommentOperations,
  type CommentPostPayload,
  type CommentReactionOption,
} from '../../types'
import {useCommentsIntent} from '../useCommentsIntent'
import {useNotificationTarget} from '../useNotificationTarget'
import {createOperation} from './createOperation'
import {editOperation} from './editOperation'
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
  documentType: string
  getComment?: (id: string) => CommentDocument | undefined
  getThreadLength?: (threadId: string) => number
  onCreate?: (comment: CommentPostPayload) => void
  onCreateError: (id: string, error: Error) => void
  onEdit?: (id: string, comment: CommentEditPayload) => void
  onRemove?: (id: string) => void
  onUpdate?: (id: string, comment: Partial<CommentCreatePayload>) => void
  projectId: string
  createAddonDataset: () => Promise<SanityClient | null>
  schemaType: SchemaType | undefined
  workspace: string
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
    getComment,
    getThreadLength,
    onCreate,
    onCreateError,
    onEdit,
    onRemove,
    onUpdate,
    projectId,
    createAddonDataset,
    workspace,
  } = opts

  const getIntent = useCommentsIntent()

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
        documentType,
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
      documentType,
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

  const handleEdit = useCallback(
    async (id: string, comment: CommentEditPayload) => {
      if (!client) return

      await editOperation({
        client,
        comment,
        id,
        onEdit,
      })
    },
    [client, onEdit],
  )

  const handleUpdate = useCallback(
    async (id: string, comment: Partial<CommentCreatePayload>) => {
      if (!client) return

      await updateOperation({
        client,
        id,
        comment,
        onUpdate,
      })
    },
    [client, onUpdate],
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
        edit: handleEdit,
        react: handleReact,
        remove: handleRemove,
        update: handleUpdate,
      } satisfies CommentOperations,
    }),
    [handleCreate, handleEdit, handleRemove, handleUpdate, handleReact],
  )
}
