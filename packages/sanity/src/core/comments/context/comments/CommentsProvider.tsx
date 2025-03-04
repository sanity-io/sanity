import {type Path} from '@sanity/types'
import {orderBy} from 'lodash'
import {memo, type ReactNode, useCallback, useMemo, useState} from 'react'
import {CommentsContext} from 'sanity/_singletons'

import {useEditState, useSchema, useUserListWithPermissions} from '../../../hooks'
import {type ReleaseId} from '../../../perspective/types'
import {useCurrentUser} from '../../../store'
import {useAddonDataset, useWorkspace} from '../../../studio'
import {getPublishedId} from '../../../util'
import {
  type CommentOperationsHookOptions,
  useCommentOperations,
  useCommentsEnabled,
} from '../../hooks'
import {useCommentsStore} from '../../store'
import {
  type CommentPostPayload,
  type CommentStatus,
  type CommentsType,
  type CommentThreadItem,
  type CommentUpdatePayload,
} from '../../types'
import {buildCommentThreadItems} from '../../utils/buildCommentThreadItems'
import {type CommentsContextValue} from './types'

const EMPTY_ARRAY: [] = []

const EMPTY_COMMENTS_DATA = {
  open: EMPTY_ARRAY,
  resolved: EMPTY_ARRAY,
}

interface ThreadItemsByStatus {
  open: CommentThreadItem[]
  resolved: CommentThreadItem[]
}

/**
 * @beta
 * @hidden
 */
export interface CommentsProviderProps {
  children: ReactNode
  documentId: string
  documentType: string
  releaseId?: ReleaseId
  type: CommentsType
  sortOrder: 'asc' | 'desc'

  isCommentsOpen?: boolean
  onCommentsOpen?: () => void
  getCommentLink?: (id: string) => string

  selectedCommentId?: string | undefined
  onClearSelectedComment?: () => void

  onPathOpen?: (path: Path) => void

  isConnecting?: boolean

  mentionsDisabled?: boolean
}

type DocumentId = string
type TransactionId = string

/**
 * @beta
 */
export const CommentsProvider = memo(function CommentsProvider(props: CommentsProviderProps) {
  const {
    children,
    documentId,
    documentType,
    isCommentsOpen,
    onCommentsOpen,
    sortOrder,
    type,
    getCommentLink,
    onClearSelectedComment,
    selectedCommentId,
    isConnecting,
    onPathOpen,
    releaseId,
    mentionsDisabled,
  } = props
  const commentsEnabled = useCommentsEnabled()
  const [status, setStatus] = useState<CommentStatus>('open')
  const {client, createAddonDataset, isCreatingDataset} = useAddonDataset()
  const publishedId = getPublishedId(documentId)

  const editState = useEditState(publishedId, documentType, 'low', releaseId)
  const schemaType = useSchema().get(documentType)
  const currentUser = useCurrentUser()

  const {name: workspaceName, dataset, projectId} = useWorkspace()

  const documentValue = useMemo(() => {
    if (releaseId) return editState.version
    return editState.draft || editState.published
  }, [editState.version, editState.draft, editState.published, releaseId])

  const documentRevisionId = useMemo(() => documentValue?._rev, [documentValue])

  // A map to keep track of the latest transaction ID for each comment document.
  const transactionsIdMap = useMemo(() => new Map<DocumentId, TransactionId>(), [])

  // When the latest transaction ID is received, we remove the transaction id from the map.
  const handleOnLatestTransactionIdReceived = useCallback(
    (commentDocumentId: string) => {
      transactionsIdMap.delete(commentDocumentId)
    },
    [transactionsIdMap],
  )

  const {
    dispatch,
    data = EMPTY_ARRAY,
    error,
    loading,
  } = useCommentsStore({
    documentId,
    releaseId,
    client,
    transactionsIdMap,
    onLatestTransactionIdReceived: handleOnLatestTransactionIdReceived,
  })

  // When a comment update is started, we store the transaction id in a map.
  // This is used to make sure that we only use the latest transaction received
  // in the real time listener. See `useCommentsStore`.
  // This is needed since we use optimistic updates in the UI, and we want to
  // avoid that the UI is updated with an old transaction id when multiple
  // transactions are started in a short time span.
  const handleOnTransactionStart = useCallback(
    (commentDocumentId: string, transactionId: string) => {
      transactionsIdMap.set(commentDocumentId, transactionId)
    },
    [transactionsIdMap],
  )

  const handleSetStatus = useCallback(
    (newStatus: CommentStatus) => {
      // Avoids going to "resolved" when using links to comments
      if (commentsEnabled.mode === 'upsell' && newStatus === 'resolved') {
        return null
      }
      return setStatus(newStatus)
    },
    [setStatus, commentsEnabled],
  )

  const mentionOptions = useUserListWithPermissions(
    useMemo(() => ({documentValue, permission: 'read'}), [documentValue]),
  )

  const threadItemsByStatus: ThreadItemsByStatus = useMemo(() => {
    if (!schemaType || !currentUser) return EMPTY_COMMENTS_DATA
    const sorted = orderBy(data, ['_createdAt'], [sortOrder])

    const items = buildCommentThreadItems({
      comments: sorted,
      currentUser,
      documentValue,
      schemaType,
      type,
    })

    return {
      open: items.filter((item) => item.parentComment.status === 'open'),
      resolved: items.filter((item) => item.parentComment.status === 'resolved'),
    }
  }, [currentUser, data, documentValue, schemaType, sortOrder, type])

  const getThreadLength = useCallback(
    (threadId: string) => {
      return threadItemsByStatus.open.filter((item) => item.threadId === threadId).length
    },
    [threadItemsByStatus.open],
  )

  const getComment = useCallback((id: string) => data?.find((c) => c._id === id), [data])

  const handleOnCreate = useCallback(
    (payload: CommentPostPayload) => {
      // If the comment we try to create already exists in the local state and has
      // the 'createError' state, we know that we are retrying a comment creation.
      // In that case, we want to change the state to 'createRetrying'.
      const hasError = data?.find((c) => c._id === payload._id)?._state?.type === 'createError'

      dispatch({
        type: 'COMMENT_ADDED',
        payload: {
          ...payload,
          _state: hasError ? {type: 'createRetrying'} : undefined,
        },
      })
    },
    [data, dispatch],
  )

  const handleOnUpdate = useCallback(
    (id: string, payload: CommentUpdatePayload) => {
      dispatch({
        type: 'COMMENT_UPDATED',
        payload: {
          _id: id,
          ...payload,
        },
      })
    },
    [dispatch],
  )

  const handleOnCreateError = useCallback(
    (id: string, err: Error) => {
      // When an error occurs during comment creation, we update the comment state
      // to `createError`. This will make the comment appear in the UI as a comment
      // that failed to be created. The user can then retry the comment creation.
      dispatch({
        type: 'COMMENT_UPDATED',
        payload: {
          _id: id,
          _state: {
            error: err,
            type: 'createError',
          },
        },
      })
    },
    [dispatch],
  )

  const {operation} = useCommentOperations(
    useMemo(
      (): CommentOperationsHookOptions => ({
        client,
        currentUser,
        dataset,
        documentId: publishedId,
        // use the current release id as document version id of the target
        documentVersionId: releaseId,
        documentRevisionId,
        documentType,
        getComment,
        getThreadLength,
        projectId,
        schemaType,
        workspace: workspaceName,
        // This function runs when the first comment creation is executed.
        // It is used to create the addon dataset and configure a client for
        // the addon dataset.
        createAddonDataset,
        // The following callbacks runs when the comment operation are executed.
        // They are used to update the local state of the comments immediately after
        // a comment operation has been executed. This is done to avoid waiting for
        // the real time listener to update the comments and make the UI feel more
        // responsive. The comment will be updated again when we receive an mutation
        // event from the real time listener.
        onCreate: handleOnCreate,
        onCreateError: handleOnCreateError,
        onUpdate: handleOnUpdate,
        onTransactionStart: handleOnTransactionStart,
        getCommentLink,
      }),
      [
        client,
        currentUser,
        dataset,
        publishedId,
        releaseId,
        documentRevisionId,
        documentType,
        getComment,
        getThreadLength,
        projectId,
        schemaType,
        workspaceName,
        createAddonDataset,
        handleOnCreate,
        handleOnCreateError,
        handleOnUpdate,
        handleOnTransactionStart,
        getCommentLink,
      ],
    ),
  )

  const ctxValue = useMemo(
    (): CommentsContextValue => ({
      documentId,
      documentType,

      isCreatingDataset,
      status,
      setStatus: handleSetStatus,
      getComment,
      getCommentLink,
      onClearSelectedComment,
      selectedCommentId,

      isCommentsOpen,
      onCommentsOpen,

      isConnecting,

      onPathOpen,

      comments: {
        data: threadItemsByStatus,
        error,
        loading: loading || isCreatingDataset || isConnecting || false,
      },

      operation: {
        create: operation.create,
        react: operation.react,
        remove: operation.remove,
        update: operation.update,
      },
      mentionOptions: {
        ...mentionOptions,
        disabled: mentionsDisabled,
      },
    }),
    [
      documentId,
      documentType,
      isCreatingDataset,
      status,
      handleSetStatus,
      getComment,
      getCommentLink,
      onClearSelectedComment,
      selectedCommentId,
      isCommentsOpen,
      onCommentsOpen,
      isConnecting,
      onPathOpen,
      threadItemsByStatus,
      error,
      loading,
      operation.create,
      operation.react,
      operation.remove,
      operation.update,
      mentionOptions,
      mentionsDisabled,
    ],
  )

  return <CommentsContext.Provider value={ctxValue}>{children}</CommentsContext.Provider>
})
