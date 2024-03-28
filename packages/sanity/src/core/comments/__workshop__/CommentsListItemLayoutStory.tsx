import {Container, Flex} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import {useMemo} from 'react'

import {useCurrentUser} from '../../store/user/hooks'
import {CommentsListItemLayout} from '../components/list/CommentsListItemLayout'
import {type CommentDocument, type CommentsUIMode} from '../types'

const MOCK_COMMENT: CommentDocument = {
  _id: 'id',
  _type: 'comment',
  _createdAt: '2023-01-01T12:00:00Z',
  _rev: 'rev',
  authorId: 'p8U8TipFc',
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
          text: 'Hello, this is my comment message',
          marks: [],
        },
      ],
    },
  ],
  reactions: [],
  status: 'open',
  threadId: 'threadId',

  contentSnapshot: [
    {
      _type: 'block',
      _key: '36a3f0d3832d',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: '89014dd684ce',
          text: 'This is the value that the comment is attached to',
          marks: [],
        },
      ],
    },
  ],

  target: {
    document: {
      _dataset: 'dataset',
      _projectId: 'projectId',
      _ref: 'ref',
      _type: 'crossDatasetReference',
      _weak: true,
    },
    documentRevisionId: 'documentRevisionId',
    documentType: 'documentType',

    path: {
      field: 'field',
      selection: {
        type: 'text',
        value: [
          {
            _key: 'key',
            text: 'This some some value that this <comment>comment is referencing</comment>',
          },
        ],
      },
    },
  },
}

const MENTION_OPTIONS = {
  data: [],
  error: null,
  loading: false,
}

const MODE_OPTIONS: Record<CommentsUIMode, CommentsUIMode> = {
  default: 'default',
  upsell: 'upsell',
}

function noop() {
  return null
}

export default function CommentsListItemLayoutStory() {
  const currentUser = useCurrentUser()
  const withContentSnapshot = useBoolean('With content snapshot', true)
  const hasReferencedValue = useBoolean('hasReferencedValue', true)
  const isParent = useBoolean('isParent', true)
  const mode = useSelect('Mode', MODE_OPTIONS, 'default') || 'default'
  const canEdit = useBoolean('canEdit', true)
  const canDelete = useBoolean('canDelete', true)

  const comment = useMemo(() => {
    return {
      ...MOCK_COMMENT,
      contentSnapshot: withContentSnapshot ? MOCK_COMMENT.contentSnapshot : undefined,
    }
  }, [withContentSnapshot])

  if (!currentUser) return null

  return (
    <Flex align="center" height="fill">
      <Container width={0}>
        <CommentsListItemLayout
          canDelete={canDelete}
          canEdit={canEdit}
          comment={comment}
          currentUser={currentUser}
          hasReferencedValue={hasReferencedValue}
          isParent={isParent}
          mentionOptions={MENTION_OPTIONS}
          mode={mode}
          onDelete={noop}
          onEdit={noop}
        />
      </Container>
    </Flex>
  )
}
