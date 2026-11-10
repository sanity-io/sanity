import {type CollaborationCommentAnchor, type SanityClient} from '@sanity/client'
import {describe, expect, test, vi} from 'vitest'

import {type CommentUpdatePayload} from '../../types'
import {updateRangeOperation} from './updateRangeOperation'

const anchor: CollaborationCommentAnchor = {
  type: 'portable-text',
  start: {_key: 'block-1', offset: 1},
  end: {_key: 'block-1', offset: 4},
  fieldValue: [{_type: 'block', _key: 'block-1', children: []}],
}

const optimisticUpdate: CommentUpdatePayload = {
  target: {
    document: {_ref: 'dataset:p.d:doc-1', _type: 'globalDocumentReference', _weak: true},
    sourceDocumentId: 'drafts.doc-1',
    documentType: 'article',
    path: {
      field: 'body',
      selection: {type: 'text', value: [{_key: 'block-1', text: 'a \uF000bc\uF001 d'}]},
    },
  },
}

function createClient(update: ReturnType<typeof vi.fn>): SanityClient {
  return {
    collaboration: {
      comments: {update},
    },
  } as unknown as SanityClient
}

describe('updateRangeOperation', () => {
  test('sends a portable-text anchor to the API', async () => {
    const update = vi.fn().mockResolvedValue(undefined)

    await updateRangeOperation({
      client: createClient(update),
      optimisticUpdate,
      anchor,
      id: 'comment-1',
      transactionId: 'transaction-1',
    })

    expect(update).toHaveBeenCalledWith('comment-1', {anchor}, {transactionId: 'transaction-1'})
  })

  test('sends null to detach an anchor', async () => {
    const update = vi.fn().mockResolvedValue(undefined)

    await updateRangeOperation({
      client: createClient(update),
      optimisticUpdate,
      id: 'comment-1',
      anchor: null,
      transactionId: 'transaction-1',
    })

    expect(update).toHaveBeenCalledWith(
      'comment-1',
      {anchor: null},
      {transactionId: 'transaction-1'},
    )
  })

  test('applies the derived selection to local state', async () => {
    const update = vi.fn().mockResolvedValue(undefined)
    const onUpdate = vi.fn()

    await updateRangeOperation({
      client: createClient(update),
      optimisticUpdate,
      anchor,
      id: 'comment-1',
      onUpdate,
      transactionId: 'transaction-1',
    })

    expect(onUpdate).toHaveBeenCalledWith('comment-1', optimisticUpdate)
  })
})
