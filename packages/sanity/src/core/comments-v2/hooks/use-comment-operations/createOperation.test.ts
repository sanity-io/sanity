import {type CollaborationCommentAnchor, type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {describe, expect, test, vi} from 'vitest'

import {type CommentFieldCreatePayload} from '../../types'
import {createOperation} from './createOperation'

const anchor: CollaborationCommentAnchor = {
  type: 'portable-text',
  start: {_key: 'block-1', offset: 1},
  end: {_key: 'block-1', offset: 4},
  fieldValue: [{_type: 'block', _key: 'block-1', children: []}],
}

const message = [{_type: 'block', _key: 'msg-1', children: [{_type: 'span', text: 'Note'}]}]

const currentUser = {sanityUserId: 'user-1'} as CurrentUser

function createClient(create: ReturnType<typeof vi.fn>): SanityClient {
  return {
    collaboration: {
      comments: {
        create,
        getTargetDocumentRef: () => 'dataset:p.d:doc-1',
      },
    },
  } as unknown as SanityClient
}

const fieldComment = {
  type: 'field',
  fieldPath: 'body',
  message,
  parentCommentId: undefined,
  reactions: [],
  status: 'open',
  threadId: 'thread-1',
} satisfies CommentFieldCreatePayload

const inlineComment = {
  ...fieldComment,
  anchor,
} satisfies CommentFieldCreatePayload

describe('createOperation', () => {
  test('sends a portable-text anchor on inline create', async () => {
    const create = vi.fn().mockResolvedValue(undefined)

    await createOperation({
      activeTool: undefined,
      client: createClient(create),
      comment: inlineComment,
      currentUser,
      versionId: 'drafts.doc-1',
      documentType: 'article',
      getNotificationValue: () => undefined,
      onCreateError: () => undefined,
      workspace: 'default',
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          documentId: 'drafts.doc-1',
          documentType: 'article',
          path: 'body',
          anchor,
        }),
      }),
    )
  })

  test('omits anchor on a field-level comment', async () => {
    const create = vi.fn().mockResolvedValue(undefined)

    await createOperation({
      activeTool: undefined,
      client: createClient(create),
      comment: fieldComment,
      currentUser,
      versionId: 'drafts.doc-1',
      documentType: 'article',
      getNotificationValue: () => undefined,
      onCreateError: () => undefined,
      workspace: 'default',
    })

    const payload = create.mock.calls[0]?.[0]
    expect(payload.target).toEqual({
      documentId: 'drafts.doc-1',
      documentType: 'article',
      path: 'body',
    })
    expect(payload.target).not.toHaveProperty('anchor')
    expect(payload.target).not.toHaveProperty('range')
    expect(payload.target).not.toHaveProperty('fieldValue')
  })
})
