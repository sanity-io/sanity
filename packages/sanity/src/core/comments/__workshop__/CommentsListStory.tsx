import {Schema} from '@sanity/schema'
import {Container, Flex} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import {uuid} from '@sanity/uuid'
import {useCallback, useMemo, useState} from 'react'

import {useUserListWithPermissions} from '../../hooks/useUserListWithPermissions'
import {useCurrentUser} from '../../store/user/hooks'
import {CommentsList} from '../components/list/CommentsList'
import {
  type CommentBaseCreatePayload,
  type CommentDocument,
  type CommentReactionOption,
  type CommentStatus,
  type CommentUpdatePayload,
} from '../types'
import {buildCommentThreadItems} from '../utils/buildCommentThreadItems'

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
  authorId: 'p8U8TipFc',
  status: 'open',
  _rev: '1',
  reactions: [],

  threadId: '1',

  target: {
    documentType: 'article',
    documentRevisionId: '',
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

const INTENT: CommentDocument = {
  ...BASE,
  _id: '2',
  threadId: '2',
  message: [
    {
      _type: 'block',
      _key: '36a3f0d3832d',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '89014dd684cc',
          text: 'A comment with context',
          marks: [],
        },
      ],
    },
  ],
  context: {
    payload: {
      workspace: 'default',
    },
    intent: {
      title: 'Page One',
      name: 'edit',
      params: {
        id: 'd73bb3d8-b1b7-4ca3-8f55-969bba902cd3',
        path: 'string',
        type: 'commentsDebug',
        inspect: 'sanity/comments',
        mode: 'structure',
        preview: '/page-one',
      },
    },
    tool: 'structure',
  },
}

const INTENT_RESPONSE_SAME = {
  ...INTENT,
  _id: '3',
  parentCommentId: '2',
  message: [
    {
      _type: 'block',
      _key: '36a3f0d3832d',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '89014dd684cc',
          text: 'A response with context',
          marks: [],
        },
      ],
    },
  ],
}

const INTENT_RESPONSE_DIFF = {
  ...INTENT_RESPONSE_SAME,
  _id: '4',
  context: {
    payload: {
      workspace: 'default',
    },
    intent: {
      title: 'Page Two',
      name: 'edit',
      params: {
        id: 'd73bb3d8-b1b7-4ca3-8f55-969bba902cd3',
        path: 'string',
        type: 'commentsDebug',
        inspect: 'sanity/comments',
        mode: 'structure',
        preview: '/page-two',
      },
    },
    tool: 'structure',
  },
}

const MENTION_HOOK_OPTIONS = {
  documentValue: {
    _type: 'author',
    _id: 'grrm',
    _createdAt: '2021-05-04T14:54:37Z',
    _rev: '1',
    _updatedAt: '2021-05-04T14:54:37Z',
  },
  permission: 'read' as const,
}

const STATUS_OPTIONS: Record<CommentStatus, CommentStatus> = {open: 'open', resolved: 'resolved'}

export default function CommentsListStory() {
  const [state, setState] = useState<CommentDocument[]>([
    BASE,
    INTENT,
    INTENT_RESPONSE_DIFF,
    INTENT_RESPONSE_SAME,
  ])

  const error = useBoolean('Error', false, 'Props') || null
  const loading = useBoolean('Loading', false, 'Props') || false
  const emptyState = useBoolean('Empty', false, 'Props') || false
  const status = useSelect('Status', STATUS_OPTIONS, 'open', 'Props') || 'open'
  const readOnly = useBoolean('Read only', false, 'Props') || false

  const currentUser = useCurrentUser()

  const mentionOptions = useUserListWithPermissions(MENTION_HOOK_OPTIONS)

  const handleReplySubmit = useCallback(
    (payload: CommentBaseCreatePayload) => {
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

  const handleEdit = useCallback((id: string, payload: CommentUpdatePayload) => {
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
    (payload: CommentBaseCreatePayload) => {
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

  const handleReactionSelect = useCallback(
    (id: string, reaction: CommentReactionOption) => {
      const comment = state.find((item) => item._id === id)
      const reactions = comment?.reactions || []
      const hasReacted = reactions.some((r) => r.shortName === reaction.shortName)

      // 1. If there are no reactions, add the reaction to the comment
      if (reactions.length === 0) {
        const next = state.map((item) => {
          if (item._id === id) {
            return {
              ...item,
              reactions: [
                {
                  ...reaction,
                  userId: currentUser?.id || '',
                  _key: uuid(),
                  addedAt: new Date().toISOString(),
                },
              ],
            }
          }

          return item
        })

        setState(next)
      }

      // 2. If the user has reacted, remove the reaction
      if (hasReacted) {
        const next = state.map((item) => {
          if (item._id === id) {
            return {
              ...item,
              reactions: reactions.filter((r) => r.shortName !== reaction.shortName),
            }
          }

          return item
        })

        setState(next)
      }

      // 3. If the user has not reacted, add the reaction
      if (!hasReacted) {
        const next = state.map((item) => {
          if (item._id === id) {
            return {
              ...item,
              reactions: [
                ...reactions,
                {
                  ...reaction,
                  userId: currentUser?.id || '',
                  _key: uuid(),
                  addedAt: new Date().toISOString(),
                },
              ],
            }
          }

          return item
        })

        setState(next)
      }
    },
    [currentUser?.id, state],
  )

  const threadItems = useMemo(() => {
    if (!currentUser || emptyState) return []

    const items = buildCommentThreadItems({
      comments: state.filter((item) => item.status === status),
      currentUser,
      documentValue: {},
      schemaType: schema.get('article'),
      type: 'field',
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
          onReactionSelect={handleReactionSelect}
          onReply={handleReplySubmit}
          onStatusChange={handleStatusChange}
          readOnly={readOnly}
          selectedPath={null}
          status={status}
          mode="default"
        />
      </Container>
    </Flex>
  )
}
