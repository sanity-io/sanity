import React, {useCallback, useMemo, useState} from 'react'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import {Schema} from '@sanity/schema'
import {uuid} from '@sanity/uuid'
import {Container, Flex} from '@sanity/ui'
import {CommentsList} from '../components'
import {CommentDocument, CommentCreatePayload, CommentEditPayload, CommentStatus} from '../types'
import {buildCommentThreadItems} from '../utils/buildCommentThreadItems'
import {useMentionOptions} from '../hooks'
import {useCurrentUser} from 'sanity'

const noop = () => {
  // noop
}

const schema = Schema.compile({
  name: 'default',
  types: [
    {
      type: 'document',
      name: 'article',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'My string title',
        },
      ],
    },
  ],
})

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
      field: 'title',
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

const MENTION_HOOK_OPTIONS = {
  documentValue: {
    _type: 'author',
    _id: 'grrm',
    _createdAt: '2021-05-04T14:54:37Z',
    _rev: '1',
    _updatedAt: '2021-05-04T14:54:37Z',
  },
}

const STATUS_OPTIONS: Record<CommentStatus, CommentStatus> = {open: 'open', resolved: 'resolved'}

export default function CommentsListStory() {
  const [state, setState] = useState<CommentDocument[]>([BASE])

  const error = useBoolean('Error', false, 'Props') || null
  const loading = useBoolean('Loading', false, 'Props') || false
  const emptyState = useBoolean('Empty', false, 'Props') || false
  const status = useSelect('Status', STATUS_OPTIONS, 'open', 'Props') || 'open'

  const currentUser = useCurrentUser()

  const mentionOptions = useMentionOptions(MENTION_HOOK_OPTIONS)

  const handleReplySubmit = useCallback(
    (payload: CommentCreatePayload) => {
      const reply: CommentDocument = {
        ...BASE,
        ...payload,
        _createdAt: new Date().toISOString(),
        _id: uuid(),
        authorId: currentUser?.id || 'pP5s3g90N',
        parentCommentId: payload.parentCommentId,
      }

      setState((prev) => [reply, ...prev])
    },
    [currentUser?.id],
  )

  const handleEdit = useCallback((id: string, payload: CommentEditPayload) => {
    setState((prev) => {
      return prev.map((item) => {
        if (item._id === id) {
          return {
            ...item,
            ...payload,
            _updatedAt: new Date().toISOString(),
          }
        }

        return item
      })
    })
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      setState((prev) => prev.filter((item) => item._id !== id))
    },
    [setState],
  )

  const handleNewThreadCreate = useCallback(
    (payload: CommentCreatePayload) => {
      const comment: CommentDocument = {
        ...BASE,
        ...payload,
        _createdAt: new Date().toISOString(),
        _id: uuid(),
        authorId: currentUser?.id || 'pP5s3g90N',
      }

      setState((prev) => [comment, ...prev])
    },
    [currentUser?.id],
  )

  const handleStatusChange = useCallback(
    (id: string, newStatus: CommentStatus) => {
      setState((prev) => {
        return prev.map((item) => {
          if (item._id === id) {
            return {
              ...item,
              status: newStatus,
              _updatedAt: new Date().toISOString(),
            }
          }

          if (item.parentCommentId === id) {
            return {
              ...item,
              status: newStatus,
              _updatedAt: new Date().toISOString(),
            }
          }

          return item
        })
      })
    },
    [setState],
  )

  const threadItems = useMemo(() => {
    if (!currentUser || emptyState) return []

    const items = buildCommentThreadItems({
      comments: state.filter((item) => item.status === status),
      currentUser,
      documentValue: {},
      schemaType: schema.get('article'),
    })

    return items
  }, [currentUser, emptyState, state, status])

  if (!currentUser) return null

  return (
    <Flex height="fill" overflow="hidden" padding={3}>
      <Container width={1}>
        <CommentsList
          comments={threadItems}
          currentUser={currentUser}
          error={error ? new Error('Something went wrong') : null}
          loading={loading}
          mentionOptions={mentionOptions}
          onCreateRetry={noop}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onNewThreadCreate={handleNewThreadCreate}
          onReply={handleReplySubmit}
          onStatusChange={handleStatusChange}
          status={status}
        />
      </Container>
    </Flex>
  )
}
