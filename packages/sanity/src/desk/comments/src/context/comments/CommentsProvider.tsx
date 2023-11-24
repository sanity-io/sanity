import React, {memo, useCallback, useMemo, useState} from 'react'
import {orderBy} from 'lodash'
import {
  CommentCreatePayload,
  CommentEditPayload,
  CommentPostPayload,
  CommentStatus,
  CommentThreadItem,
} from '../../types'
import {
  CommentOperationsHookOptions,
  MentionHookOptions,
  useCommentOperations,
  useCommentsSetup,
  useMentionOptions,
} from '../../hooks'
import {useCommentsStore} from '../../store'
import {buildCommentThreadItems} from '../../utils/buildCommentThreadItems'
import {CommentsContext} from './CommentsContext'
import {CommentsContextValue} from './types'
import {getPublishedId, useEditState, useSchema, useCurrentUser, useWorkspace} from 'sanity'

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
  children: React.ReactNode
  documentId: string
  documentType: string
}

/**
 * @beta
 */
export const CommentsProvider = memo(function CommentsProvider(props: CommentsProviderProps) {
  const {children, documentId, documentType} = props
  const [status, setStatus] = useState<CommentStatus>('open')

  const {client, runSetup, isRunningSetup} = useCommentsSetup()
  const publishedId = getPublishedId(documentId)
  const editState = useEditState(publishedId, documentType, 'low')

  const documentValue = useMemo(() => {
    return editState.draft || editState.published
  }, [editState.draft, editState.published])

  const {
    dispatch,
    data = EMPTY_ARRAY,
    error,
    loading,
  } = useCommentsStore({
    documentId: publishedId,
    client,
  })

  const mentionOptions = useMentionOptions(
    useMemo((): MentionHookOptions => ({documentValue}), [documentValue]),
  )

  const schemaType = useSchema().get(documentType)
  const currentUser = useCurrentUser()
  const {name: workspaceName, dataset, projectId} = useWorkspace()

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
    async (payload: CommentPostPayload) => {
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
    (id: string, payload: Partial<CommentCreatePayload>) => {
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

  const handleOnEdit = useCallback(
    (id: string, payload: CommentEditPayload) => {
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
        // This function runs when the first comment creation is executed.
        // It is used to create the addon dataset and configure a client for
        // the addon dataset.
        runSetup,
        // The following callbacks runs when the comment operations are executed.
        // They are used to update the local state of the comments immediately after
        // a comment operation has been executed. This is done to avoid waiting for
        // the real time listener to update the comments and make the UI feel more
        // responsive. The comment will be updated again when we receive an mutation
        // event from the real time listener.
        onCreate: handleOnCreate,
        onCreateError: handleOnCreateError,
        onEdit: handleOnEdit,
        onUpdate: handleOnUpdate,
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
        runSetup,
        handleOnCreate,
        handleOnCreateError,
        handleOnEdit,
        handleOnUpdate,
      ],
    ),
  )

  const ctxValue = useMemo(
    (): CommentsContextValue => ({
      isRunningSetup,

      status,
      setStatus,

      getComment,

      comments: {
        data: threadItemsByStatus,
        error,
        loading: loading || isRunningSetup,
      },
      create: {
        execute: operation.create,
      },
      remove: {
        execute: operation.remove,
      },
      edit: {
        execute: operation.edit,
      },
      update: {
        execute: operation.update,
      },
      mentionOptions,
    }),
    [
      isRunningSetup,
      status,
      getComment,
      threadItemsByStatus,
      error,
      loading,
      operation.create,
      operation.remove,
      operation.edit,
      operation.update,
      mentionOptions,
    ],
  )

  return <CommentsContext.Provider value={ctxValue}>{children}</CommentsContext.Provider>
})
