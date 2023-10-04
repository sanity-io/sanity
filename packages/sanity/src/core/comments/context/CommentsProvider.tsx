import React, {memo, useCallback, useMemo, useState} from 'react'
import {SanityDocument} from '@sanity/client'
import {orderBy} from 'lodash'
import {CommentStatus, CommentsContextValue} from '../types'
import {useCommentOperations, useCommentsEnabled, useMentionOptions} from '../hooks'
import {useCommentsStore} from '../store'
import {useSchema} from '../../hooks'
import {useCurrentUser} from '../../store'
import {useWorkspace} from '../../studio'
import {getPublishedId} from '../../util'
import {buildCommentThreadItems} from '../utils/buildCommentThreadItems'
import {CommentsContext} from './CommentsContext'

const EMPTY_ARRAY: [] = []

const EMPTY_COMMENTS_DATA = {
  open: EMPTY_ARRAY,
  resolved: EMPTY_ARRAY,
}

/**
 * @beta
 * @hidden
 */
export interface CommentsProviderProps {
  children: React.ReactNode
  documentValue: SanityDocument
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
  const {children, documentValue} = props

  const {isEnabled} = useCommentsEnabled({
    documentId: documentValue._id,
    documentType: documentValue._type,
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

const EMPTY = {}

function CommentsProviderInner(props: Omit<CommentsProviderProps, 'enabled'>) {
  const {children, documentValue} = props
  const {_id: documentId, _type: documentType} = documentValue || EMPTY

  const [status, setStatus] = useState<CommentStatus>('open')

  const {dispatch, data = EMPTY_ARRAY, error, loading} = useCommentsStore({documentId})
  const mentionOptions = useMentionOptions({documentValue})

  const schemaType = useSchema().get(documentType)
  const currentUser = useCurrentUser()
  const {name: workspaceName, dataset, projectId} = useWorkspace()

  const {operation} = useCommentOperations({
    currentUser,
    dataset,
    documentId: getPublishedId(documentId),
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
  })

  const threadItemsByStatus = useMemo(() => {
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
      error,
      getComment,
      loading,
      mentionOptions,
      operation.create,
      operation.edit,
      operation.remove,
      operation.update,
      status,
      threadItemsByStatus,
    ],
  )

  return <CommentsContext.Provider value={ctxValue}>{children}</CommentsContext.Provider>
}
