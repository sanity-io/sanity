import React, {memo, useMemo} from 'react'
import {SanityDocument} from '@sanity/client'
import {CommentDocument, CommentsContextValue} from '../types'
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

const EMPTY_DATA = {
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
  comments: EMPTY_DATA,
  create: noopOperation,
  remove: noopOperation,
  edit: noopOperation,
  update: noopOperation,
  mentionOptions: EMPTY_DATA,
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

  const {dispatch, data, error, loading} = useCommentsStore({documentId})
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

  const ctxValue = useMemo(
    () =>
      ({
        comments: {
          data: data || EMPTY_ARRAY,
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
      data,
      error,
      loading,
      mentionOptions,
      operation.create,
      operation.edit,
      operation.remove,
      operation.update,
    ],
  )

  return <CommentsContext.Provider value={ctxValue}>{children}</CommentsContext.Provider>
}
