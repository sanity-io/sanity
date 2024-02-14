import {orderBy} from 'lodash'
import {memo, type ReactNode, useCallback, useMemo, useState} from 'react'
import {getPublishedId, useCurrentUser, useEditState, useSchema, useWorkspace} from 'sanity'

import {
  type CommentOperationsHookOptions,
  type MentionHookOptions,
  useCommentOperations,
  useCommentsEnabled,
  useCommentsSetup,
  useMentionOptions,
} from '../../hooks'
import {useCommentsStore} from '../../store'
import {
  type CommentPostPayload,
  type CommentStatus,
  type CommentThreadItem,
  type CommentUpdatePayload,
} from '../../types'
import {buildCommentThreadItems} from '../../utils/buildCommentThreadItems'
import {CommentsContext} from './CommentsContext'
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

  isCommentsOpen?: boolean
  onCommentsOpen?: () => void
}

type DocumentId = string
type TransactionId = string

/**
 * @beta
 */
export const CommentsProvider = memo(function CommentsProvider(props: CommentsProviderProps) {
  const {children, documentId, documentType, isCommentsOpen, onCommentsOpen} = props
  const commentsEnabled = useCommentsEnabled()
  const [status, setStatus] = useState<CommentStatus>('open')
  const {client, runSetup, isRunningSetup} = useCommentsSetup()
  const publishedId = getPublishedId(documentId)
  const editState = useEditState(publishedId, documentType, 'low')
  const schemaType = useSchema().get(documentType)
  const currentUser = useCurrentUser()
  const {name: workspaceName, dataset, projectId} = useWorkspace()

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
    documentId: publishedId,
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

  const documentValue = useMemo(() => {
    return editState.draft || editState.published
  }, [editState.draft, editState.published])

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
  const mentionOptions = useMentionOptions(
    useMemo((): MentionHookOptions => ({documentValue}), [documentValue]),
  )

  const threadItemsByStatus: ThreadItemsByStatus = useMemo(() => {
    if (!schemaType || !currentUser) return EMPTY_COMMENTS_DATA
    // Since we only make one query to get all comments using the order `_createdAt desc` – we
    // can't know for sure that the comments added through the real time listener will be in the
    // correct order. In order to avoid that comments are out of order, we make an additional
    // sort here. The comments can be out of order if e.g a comment creation fails and is retried
    // later.
    const sorted = orderBy(data, ['_createdAt'], ['desc'])

    const items = buildCommentThreadItems({
      comments: sorted,
      schemaType,
      currentUser,
      documentValue,
    })

    return {
      open: items.filter((item) => item.parentComment.status === 'open'),
      resolved: items.filter((item) => item.parentComment.status === 'resolved'),
    }
  }, [currentUser, data, documentValue, schemaType])

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
        documentType,
        projectId,
        schemaType,
        workspace: workspaceName,
        getThreadLength,
        getComment,
        // This function runs when the first comment creation is executed.
        // It is used to create the addon dataset and configure a client for
        // the addon dataset.
        runSetup,
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
      }),
      [
        client,
        currentUser,
        dataset,
        publishedId,
        documentType,
        projectId,
        schemaType,
        workspaceName,
        getThreadLength,
        getComment,
        runSetup,
        handleOnCreate,
        handleOnCreateError,
        handleOnUpdate,
        handleOnTransactionStart,
      ],
    ),
  )

  const ctxValue = useMemo(
    (): CommentsContextValue => ({
      isRunningSetup,
      status,
      setStatus: handleSetStatus,
      getComment,

      isCommentsOpen,
      onCommentsOpen,

      comments: {
        data: threadItemsByStatus,
        error,
        loading: loading || isRunningSetup,
      },

      operation: {
        create: operation.create,
        react: operation.react,
        remove: operation.remove,
        update: operation.update,
      },
      mentionOptions,
    }),
    [
      error,
      getComment,
      isCommentsOpen,
      isRunningSetup,
      loading,
      mentionOptions,
      onCommentsOpen,
      operation.create,
      operation.react,
      operation.remove,
      operation.update,
      status,
      handleSetStatus,
      threadItemsByStatus,
    ],
  )

  return <CommentsContext.Provider value={ctxValue}>{children}</CommentsContext.Provider>
})
