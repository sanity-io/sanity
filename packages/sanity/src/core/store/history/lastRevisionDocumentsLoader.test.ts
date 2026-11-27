import {firstValueFrom} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../test/mocks/mockSanityClient'
import {HISTORY_MAX_CONCURRENT_REQUESTS, runWithHistoryRequestSlot} from './historyRequestLimiter'
import {loadLastRevisionDocuments} from './lastRevisionDocumentsLoader'

const HISTORY_URL = '/data/history/mock-data-set/documents/'

function createDocument(id: string) {
  return {_id: id, _type: 'article', _rev: `rev-${id}`, _createdAt: '', _updatedAt: ''}
}

function setup(options: {documents?: ReturnType<typeof createDocument>[]; failWith?: number} = {}) {
  const requestedUrls: string[] = []
  const client = createMockSanityClientAsClient({
    requests: {'*': {documents: options.documents ?? []}},
    requestCallback: ({url}) => {
      requestedUrls.push(url)
      return options.failWith ? {statusCode: options.failWith, data: 'Rate limited'} : undefined
    },
  })
  const requestedIds = () =>
    requestedUrls.map((url) => url.slice(HISTORY_URL.length).split('?')[0].split(','))
  return {client, requestedUrls, requestedIds}
}

describe('loadLastRevisionDocuments', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sends the ids that separate callers load within the same window in one request', async () => {
    const {client, requestedUrls} = setup({
      documents: [createDocument('a'), createDocument('b'), createDocument('c')],
    })

    const first = firstValueFrom(loadLastRevisionDocuments(client, ['a']))
    const second = firstValueFrom(loadLastRevisionDocuments(client, ['b', 'c']))

    await vi.advanceTimersByTimeAsync(19)
    expect(requestedUrls).toEqual([])

    await vi.advanceTimersByTimeAsync(1)
    expect(requestedUrls).toEqual([`${HISTORY_URL}a,b,c?lastRevision=true`])
    await expect(first).resolves.toEqual([createDocument('a')])
    await expect(second).resolves.toEqual([createDocument('b'), createDocument('c')])
  })

  it('sends the ids loaded after a request has gone out in a request of their own', async () => {
    const {client, requestedIds} = setup({documents: [createDocument('a'), createDocument('b')]})

    const first = firstValueFrom(loadLastRevisionDocuments(client, ['a']))
    await vi.advanceTimersByTimeAsync(20)
    const second = firstValueFrom(loadLastRevisionDocuments(client, ['b']))
    await vi.advanceTimersByTimeAsync(20)

    expect(requestedIds()).toEqual([['a'], ['b']])
    await expect(first).resolves.toEqual([createDocument('a')])
    await expect(second).resolves.toEqual([createDocument('b')])
  })

  it('sends at most 10 ids per request', async () => {
    const ids = Array.from({length: 12}, (_, index) => `doc${index}`)
    const {client, requestedIds} = setup({documents: ids.map(createDocument)})

    const result = firstValueFrom(loadLastRevisionDocuments(client, ids))
    await vi.advanceTimersByTimeAsync(20)

    expect(requestedIds()).toEqual([ids.slice(0, 10), ids.slice(10)])
    await expect(result).resolves.toEqual(ids.map(createDocument))
  })

  it('sends an id that is loaded twice in the same window once', async () => {
    const {client, requestedIds} = setup({documents: [createDocument('a')]})

    const first = firstValueFrom(loadLastRevisionDocuments(client, ['a']))
    const second = firstValueFrom(loadLastRevisionDocuments(client, ['a']))
    await vi.advanceTimersByTimeAsync(20)

    expect(requestedIds()).toEqual([['a']])
    await expect(first).resolves.toEqual([createDocument('a')])
    await expect(second).resolves.toEqual([createDocument('a')])
  })

  it('returns the documents in the order of the ids, whatever order the response has', async () => {
    const {client} = setup({
      documents: [createDocument('c'), createDocument('a'), createDocument('b')],
    })

    const result = firstValueFrom(loadLastRevisionDocuments(client, ['a', 'b', 'c']))
    await vi.advanceTimersByTimeAsync(20)

    await expect(result).resolves.toEqual([
      createDocument('a'),
      createDocument('b'),
      createDocument('c'),
    ])
  })

  it('returns null for a document the History API has no revision of', async () => {
    const {client} = setup({documents: [createDocument('a')]})

    const result = firstValueFrom(loadLastRevisionDocuments(client, ['a', 'purged']))
    await vi.advanceTimersByTimeAsync(20)

    await expect(result).resolves.toEqual([createDocument('a'), null])
  })

  it('fails every caller whose ids were in a request that failed', async () => {
    const {client, requestedIds} = setup({failWith: 429})

    const first = firstValueFrom(loadLastRevisionDocuments(client, ['a']))
    const second = firstValueFrom(loadLastRevisionDocuments(client, ['b']))
    const settled = Promise.allSettled([first, second])
    await vi.advanceTimersByTimeAsync(20)

    expect(requestedIds()).toEqual([['a', 'b']])
    expect(await settled).toEqual([
      {status: 'rejected', reason: expect.objectContaining({statusCode: 429})},
      {status: 'rejected', reason: expect.objectContaining({statusCode: 429})},
    ])
  })

  it('waits for a free history request slot before sending a request', async () => {
    const {client, requestedIds} = setup({documents: [createDocument('a')]})
    const releaseHeldSlots: Array<() => void> = []
    const heldSlots = Array.from({length: HISTORY_MAX_CONCURRENT_REQUESTS}, () =>
      runWithHistoryRequestSlot(
        () => new Promise<void>((resolve) => releaseHeldSlots.push(resolve)),
      ),
    )

    const result = firstValueFrom(loadLastRevisionDocuments(client, ['a']))
    await vi.advanceTimersByTimeAsync(20)
    expect(requestedIds()).toEqual([])

    releaseHeldSlots[0]()
    await expect(result).resolves.toEqual([createDocument('a')])
    expect(requestedIds()).toEqual([['a']])

    for (const release of releaseHeldSlots) release()
    await Promise.all(heldSlots)
  })
})
