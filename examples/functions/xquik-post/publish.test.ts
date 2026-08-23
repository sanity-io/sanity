import {describe, expect, test} from 'vitest'

import {buildIdempotencyKey, publishXPost, type WriteAction, type WriteClient} from './publish'

const successAction = (overrides: Partial<WriteAction> = {}): WriteAction => ({
  id: 'action-1',
  pollAfterMs: null,
  result: {id: 'tweet-1'},
  status: 'success',
  success: true,
  terminal: true,
  ...overrides,
})

describe('buildIdempotencyKey', () => {
  const input = {
    account: '@sanity',
    documentId: 'post-1',
    imageUrl: 'https://cdn.sanity.io/image.png',
    revision: 'revision-1',
    text: 'Hello from Sanity',
  }

  test('returns the same key for the same intended post', () => {
    expect(buildIdempotencyKey(input)).toBe(buildIdempotencyKey({...input}))
  })

  test('changes when the document revision changes', () => {
    expect(buildIdempotencyKey(input)).not.toBe(
      buildIdempotencyKey({...input, revision: 'revision-2'}),
    )
  })
})

describe('publishXPost', () => {
  const baseInput = {
    account: '@sanity',
    documentId: 'post-1',
    revision: 'revision-1',
    text: 'Hello from Sanity',
  }

  test('creates a post with a deterministic key and public image URL', async () => {
    const requests: unknown[] = []
    const client: WriteClient = {
      createTweet: async (input) => {
        requests.push(input)
        return successAction()
      },
      getWriteAction: async () => {
        throw new Error('Unexpected poll')
      },
    }

    const result = await publishXPost({
      ...baseInput,
      client,
      imageUrl: 'https://cdn.sanity.io/image.png',
    })

    expect(requests).toEqual([
      {
        'account': '@sanity',
        'Idempotency-Key': buildIdempotencyKey({
          ...baseInput,
          imageUrl: 'https://cdn.sanity.io/image.png',
        }),
        'media': ['https://cdn.sanity.io/image.png'],
        'text': 'Hello from Sanity',
      },
    ])
    expect(result.url).toBe('https://x.com/i/web/status/tweet-1')
  })

  test('polls a pending write action until it becomes terminal', async () => {
    const delays: number[] = []
    const actions: WriteAction[] = [
      successAction({
        id: 'action-1',
        pollAfterMs: 125,
        result: null,
        status: 'dispatching',
        success: false,
        terminal: false,
      }),
      successAction(),
    ]
    const client: WriteClient = {
      createTweet: async () => actions[0],
      getWriteAction: async () => actions[1],
    }

    const result = await publishXPost({
      ...baseInput,
      client,
      sleep: async (milliseconds) => {
        delays.push(milliseconds)
      },
    })

    expect(delays).toEqual([125])
    expect(result.action.status).toBe('success')
  })

  test('reports a terminal write failure', async () => {
    const client: WriteClient = {
      createTweet: async () =>
        successAction({
          message: 'X rejected the post.',
          result: null,
          status: 'failed',
          success: false,
        }),
      getWriteAction: async () => {
        throw new Error('Unexpected poll')
      },
    }

    await expect(publishXPost({...baseInput, client})).rejects.toThrow('X rejected the post.')
  })

  test('rejects an empty post before sending a write', async () => {
    let createCalls = 0
    const client: WriteClient = {
      createTweet: async () => {
        createCalls += 1
        return successAction()
      },
      getWriteAction: async () => {
        throw new Error('Unexpected poll')
      },
    }

    await expect(publishXPost({...baseInput, client, text: '   '})).rejects.toThrow(
      'The X post text is empty.',
    )
    expect(createCalls).toBe(0)
  })

  test('requires a tweet ID from a successful action', async () => {
    const client: WriteClient = {
      createTweet: async () => successAction({result: null}),
      getWriteAction: async () => {
        throw new Error('Unexpected poll')
      },
    }

    await expect(publishXPost({...baseInput, client})).rejects.toThrow(
      'X confirmed the post but did not return its ID.',
    )
  })

  test('rejects non-HTTPS media before sending a write', async () => {
    let createCalls = 0
    const client: WriteClient = {
      createTweet: async () => {
        createCalls += 1
        return successAction()
      },
      getWriteAction: async () => {
        throw new Error('Unexpected poll')
      },
    }

    await expect(
      publishXPost({...baseInput, client, imageUrl: 'http://example.com/image.png'}),
    ).rejects.toThrow('The X post image must use HTTPS.')
    expect(createCalls).toBe(0)
  })
})
