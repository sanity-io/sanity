import React, {useCallback, useState} from 'react'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import {CommentsList} from '../components'
import {useCurrentUser} from '../../store'
import {
  CommentDocument,
  CommentCreatePayload,
  CommentEditPayload,
  CommentStatus,
  CommentThreadItem,
} from '../types'

const BASE: CommentDocument = {
  _id: '1',
  _type: 'comment',
  _createdAt: new Date().toISOString(),
  _updatedAt: '2021-05-04T14:54:37Z',
  authorId: 'p8U8TipFc',
  status: 'open',
  _rev: '1',

  threadId: '1',

  target: {
    documentType: 'article',
    path: {
      field: JSON.stringify([]),
    },
    document: {
      _dataset: '1',
      _projectId: '1',
      _ref: '1',
      _type: 'crossDatasetReference',
      _weak: true,
    },
  },
  message: [
    {
      _type: 'block',
      _key: '36a3f0d3832d',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '89014dd684ce',
          text: 'My first comment',
          marks: [],
        },
      ],
    },
  ],
}

const PROPS: CommentThreadItem = {
  parentComment: BASE,
  breadcrumbs: [],
  commentsCount: 1,
  fieldPath: 'test',
  replies: [],
  threadId: '1',
}

const STATUS_OPTIONS: Record<CommentStatus, CommentStatus> = {open: 'open', resolved: 'resolved'}

export default function CommentsListStory() {
  const [state, setState] = useState<CommentThreadItem>(PROPS)

  const error = useBoolean('Error', false, 'Props') || null
  const loading = useBoolean('Loading', false, 'Props') || false
  const emptyState = useBoolean('Empty', false, 'Props') || false
  const status = useSelect('Status', STATUS_OPTIONS, 'open', 'Props') || 'open'

  const currentUser = useCurrentUser()

  const handleReplySubmit = useCallback(
    (payload: CommentCreatePayload) => {
      const comment: CommentDocument = {
        ...BASE,
        ...payload,
        _createdAt: new Date().toISOString(),
        _id: `${state.commentsCount + 1}`,
        authorId: currentUser?.id || 'pP5s3g90N',
        parentCommentId: payload.parentCommentId,
      }

      setState((prev) => {
        return {
          ...prev,
          replies: [...prev.replies, comment],
        }
      })
    },
    [currentUser?.id, state.commentsCount],
  )

  const handleEdit = useCallback(
    (id: string, payload: CommentEditPayload) => {
      const isParentEdit = id === state.parentComment._id

      if (isParentEdit) {
        setState((prev) => {
          return {
            ...prev,
            parentComment: {
              ...prev.parentComment,
              ...payload,
              _updatedAt: new Date().toISOString(),
            },
          }
        })
      }

      setState((prev) => {
        return {
          ...prev,
          replies: prev.replies.map((item) => {
            if (item._id === id) {
              return {
                ...item,
                ...payload,
                _updatedAt: new Date().toISOString(),
              }
            }

            return item
          }),
        }
      })
    },
    [state.parentComment._id],
  )

  const handleDelete = useCallback(
    (id: string) => {
      setState((prev) => {
        return {
          ...prev,
          replies: prev.replies.filter((item) => item._id !== id),
        }
      })
    },
    [setState],
  )

  if (!currentUser) return null

  return (
    <CommentsList
      comments={emptyState ? [] : [state]}
      currentUser={currentUser}
      error={error ? new Error('Something went wrong') : null}
      loading={loading}
      mentionOptions={{data: [], error: null, loading: false}}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onReply={handleReplySubmit}
      status={status}
      onCreateRetry={() => {
        // ...
      }}
      onNewThreadCreate={() => {
        // ...
      }}
    />
  )
}
