import React, {memo, useMemo, useState} from 'react'
import {SanityDocument} from '@sanity/client'
import {CommentDocument, CommentStatus, CommentsContextValue} from '../types'
import {useCommentOperations, useCommentsEnabled, useMentionOptions} from '../hooks'
import {useCommentsStore} from '../store'
import {useSchema} from '../../hooks'
import {useCurrentUser} from '../../store'
import {useWorkspace} from '../../studio'
import {getPublishedId} from '../../util'
import {CommentsContext} from './CommentsContext'

const EMPTY_ARRAY: CommentDocument[] = []

/**
 * @beta
 * @hidden
 */
export interface CommentsProviderProps {
  children: React.ReactNode
  /** The document value is being used to:
   * - Attach a comment to a document using the _id
   * - Check user permissions with grants filter to determine if a user can be mentioned (see `useMentionOptions`)
   */
  documentValue: SanityDocument
}

const EMPTY_COMMENTS = {
  data: {
    open: EMPTY_ARRAY,
    resolved: EMPTY_ARRAY,
  },
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

function CommentsProviderInner(props: Omit<CommentsProviderProps, 'enabled'>) {
  const {children, documentValue} = props
  const {_id: documentId, _type: documentType} = documentValue || {}

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

    // The following callbacks are used to update the local state
    // when a comment is created, updated or deleted to make the
    // UI feel more responsive.
    onCreate: (payload) => {
      dispatch({type: 'COMMENT_ADDED', result: payload})
    },

    onEdit: (id, payload) => {
      dispatch({
        type: 'COMMENT_UPDATED',
        result: {
          _id: id,
          ...payload,
        },
      })
    },

    onUpdate: (id, payload) => {
      dispatch({
        type: 'COMMENT_UPDATED',
        result: {
          _id: id,
          ...payload,
        },
      })
    },
  })

  const commentsByStatus = useMemo(() => {
    const open = data?.filter((c) => c.status === 'open') || EMPTY_ARRAY
    const resolved = data?.filter((c) => c.status === 'resolved') || EMPTY_ARRAY
    return {open, resolved}
  }, [data])

  const ctxValue = useMemo(
    () =>
      ({
        status,
        setStatus,
        comments: {
          data: commentsByStatus,
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
      commentsByStatus,
      error,
      loading,
      mentionOptions,
      operation.create,
      operation.edit,
      operation.remove,
      operation.update,
      status,
    ],
  )

  return <CommentsContext.Provider value={ctxValue}>{children}</CommentsContext.Provider>
}
