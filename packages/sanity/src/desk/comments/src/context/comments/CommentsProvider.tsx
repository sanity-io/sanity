import React, {memo, useCallback, useMemo, useState} from 'react'
import {orderBy} from 'lodash'
import {CommentStatus, CommentThreadItem} from '../../types'
import {useCommentOperations, useCommentsEnabled, useMentionOptions} from '../../hooks'
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

const EMPTY_COMMENTS = {
  data: EMPTY_COMMENTS_DATA,
  error: null,
  loading: false,
}

const EMPTY_MENTION_OPTIONS = {
  data: [],
  error: null,
  loading: false,
}

const noop = async () => {
  await Promise.resolve()
}

const noopOperation = {
  execute: noop,
}

const COMMENTS_DISABLED_CONTEXT: CommentsContextValue = {
  comments: EMPTY_COMMENTS,
  create: noopOperation,
  edit: noopOperation,
  getComment: () => undefined,
  mentionOptions: EMPTY_MENTION_OPTIONS,
  remove: noopOperation,
  setStatus: noop,
  status: 'open',
  update: noopOperation,
}

/**
 * @beta
 * @hidden
 */
export const CommentsProvider = memo(function CommentsProvider(props: CommentsProviderProps) {
  const {children, documentId, documentType} = props

  const {isEnabled} = useCommentsEnabled({
    documentId,
    documentType,
  })

  if (!isEnabled) {
    return (
      <CommentsContext.Provider value={COMMENTS_DISABLED_CONTEXT}>
        {children}
      </CommentsContext.Provider>
    )
  }

  return <CommentsProviderInner {...props} />
})

const CommentsProviderInner = memo(function CommentsProviderInner(
  props: Omit<CommentsProviderProps, 'enabled'>,
) {
  const {children, documentId, documentType} = props

  const publishedId = getPublishedId(documentId)
  const editState = useEditState(publishedId, documentType, 'low')

  const documentValue = useMemo(() => {
    return editState.draft || editState.published
  }, [editState.draft, editState.published])

  const [status, setStatus] = useState<CommentStatus>('open')

  const {
    dispatch,
    data = EMPTY_ARRAY,
    error,
    loading,
  } = useCommentsStore(useMemo(() => ({documentId: publishedId}), [publishedId]))

  const mentionOptions = useMentionOptions(useMemo(() => ({documentValue}), [documentValue]))

  const schemaType = useSchema().get(documentType)
  const currentUser = useCurrentUser()
  const {name: workspaceName, dataset, projectId} = useWorkspace()

  const {operation} = useCommentOperations(
    useMemo(
      () => ({
        currentUser,
        dataset,
        documentId: publishedId,
        documentType,
        projectId,
        schemaType,
        workspace: workspaceName,

        // The following callbacks runs when the comment operations are executed.
        // They are used to update the local state of the comments immediately after
        // a comment operation has been executed. This is done to avoid waiting for
        // the real time listener to update the comments and make the UI feel more
        // responsive. The comment will be updated again when we receive an mutation
        // event from the real time listener.

        onCreate: (payload) => {
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

        // When an error occurs during comment creation, we update the comment state
        // to `createError`. This will make the comment appear in the UI as a comment
        // that failed to be created. The user can then retry the comment creation.
        onCreateError: (id, err) => {
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

        onEdit: (id, payload) => {
          dispatch({
            type: 'COMMENT_UPDATED',
            payload: {
              _id: id,
              ...payload,
            },
          })
        },

        onUpdate: (id, payload) => {
          dispatch({
            type: 'COMMENT_UPDATED',
            payload: {
              _id: id,
              ...payload,
            },
          })
        },
      }),
      [
        currentUser,
        data,
        dataset,
        dispatch,
        documentType,
        projectId,
        publishedId,
        schemaType,
        workspaceName,
      ],
    ),
  )

  const threadItemsByStatus: ThreadItemsByStatus = useMemo(() => {
    if (!schemaType || !currentUser) return EMPTY_COMMENTS_DATA

    // Since we only make one query to get all comments using the order `_createdAt desc` – we
    // can't know for sure that the comments added through the real time listener will be in the
    // correct order. In order to avoid that comments are out of order, we make an additional
    // sort here. The comments can be out of order if e.g a comment creation fails and is retried
    // later.
    const sorted = orderBy(data, ['_createdAt'], ['desc'])

    const threadItems = buildCommentThreadItems({
      comments: sorted || EMPTY_ARRAY,
      schemaType,
      currentUser,
      documentValue,
    })

    return {
      open: threadItems.filter((item) => item.parentComment.status === 'open'),
      resolved: threadItems.filter((item) => item.parentComment.status === 'resolved'),
    }
  }, [currentUser, data, documentValue, schemaType])

  const getComment = useCallback((id: string) => data?.find((c) => c._id === id), [data])

  const ctxValue = useMemo(
    () =>
      ({
        status,
        setStatus,
        getComment,
        comments: {
          data: threadItemsByStatus,
          error,
          loading,
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
      }) satisfies CommentsContextValue,
    [
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
