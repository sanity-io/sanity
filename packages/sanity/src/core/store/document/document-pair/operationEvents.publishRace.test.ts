import {type SanityClient} from '@sanity/client'
import {merge, of, Subject, timer} from 'rxjs'
import {delay, map} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {type HistoryStore} from '../../history/createHistoryStore'
import {editOperations} from './editOperations'
import {type OperationsAPI} from './operations/types'

const schema = createSchema({
  name: 'default',
  types: [
    {
      name: 'article',
      title: 'Article',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {name: 'publishSource', type: 'string'},
      ],
    },
  ],
})

const idPair = {publishedId: 'article-1', draftId: 'drafts.article-1'}

// Matches what the customer's HAR shows: every write takes about a second to respond, while the
// listener event for it arrives after about 150ms.
const ACTION_LATENCY_MS = 1000
const LISTENER_LATENCY_MS = 150

function createClient(dataset: string) {
  const listener = new Subject<unknown>()
  let draftRev = 'draft-rev-0'
  let txCount = 0
  const publishRequests: unknown[] = []
  const editRequests: unknown[] = []

  const action = vi.fn(
    (
      actions: {actionType: string} | {actionType: string}[],
      options?: {transactionId?: string},
    ) => {
      const list = Array.isArray(actions) ? actions : [actions]
      if (list.some((a) => a.actionType === 'sanity.action.document.publish')) {
        publishRequests.push(actions)
        return timer(ACTION_LATENCY_MS).pipe(map(() => ({transactionId: 'publish-tx'})))
      }
      editRequests.push(actions)
      const transactionId = options?.transactionId ?? `tx-${++txCount}`
      const previousRev = draftRev
      draftRev = transactionId
      setTimeout(() => {
        listener.next({
          type: 'mutation',
          documentId: idPair.draftId,
          transactionId,
          previousRev,
          resultRev: transactionId,
          effects: {apply: [], revert: []},
          mutations: [],
          transactionTotalEvents: 1,
          transactionCurrentEvent: 1,
          visibility: 'transaction',
          transition: 'update',
        })
      }, LISTENER_LATENCY_MS)
      return timer(ACTION_LATENCY_MS).pipe(map(() => ({transactionId})))
    },
  )

  const client = {
    config: () => ({
      apiHost: 'mock.api.sanity.io',
      projectId: 'mock-project-id',
      dataset,
    }),
    observable: {
      action,
      getDocuments: vi.fn(() =>
        of([
          {_id: idPair.publishedId, _type: 'article', _rev: 'published-rev-0', title: 'Hello'},
          {_id: idPair.draftId, _type: 'article', _rev: 'draft-rev-0', title: 'Hello'},
        ]),
      ),
      listen: vi.fn(() => merge(of({type: 'welcome'}).pipe(delay(0)), listener)),
    },
    withConfig: vi.fn(),
  }
  client.withConfig.mockReturnValue(client)

  return {client: client as unknown as SanityClient, publishRequests, editRequests}
}

async function setup(dataset: string) {
  const mock = createClient(dataset)
  let operations: OperationsAPI | undefined
  const subscription = editOperations(
    {client: mock.client, historyStore: {} as HistoryStore, schema},
    idPair,
    'article',
  ).subscribe((value) => {
    operations = value
  })
  await vi.advanceTimersByTimeAsync(0)
  expect(operations?.publish.disabled).toBe(false)
  return {...mock, operations: operations!, subscription}
}

describe('operationEvents: publish right after a patch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('sends the publish when nothing was edited in the last second', async () => {
    const {operations, publishRequests, subscription} = await setup('race-baseline')

    // Custom publish action: patch, then call the original publish handler
    operations.patch.execute([{set: {publishSource: 'manual'}}])
    operations.publish.execute()

    await vi.advanceTimersByTimeAsync(10_000)
    expect(publishRequests).toHaveLength(1)
    subscription.unsubscribe()
  })

  it('sends the publish when the user edited less than a second before clicking', async () => {
    const {operations, publishRequests, editRequests, subscription} = await setup('race-repro')

    // The user types: autocommit sends this edit at once and opens its 1s throttle window
    operations.patch.execute([{set: {title: 'Hello!'}}])
    await vi.advanceTimersByTimeAsync(700)
    expect(editRequests).toHaveLength(1)

    // 0.7s later, with the edit still in flight, the user clicks the custom publish action:
    // it patches, then calls the original publish handler
    operations.patch.execute([{set: {publishSource: 'manual'}}])
    operations.publish.execute()

    await vi.advanceTimersByTimeAsync(10_000)
    // The wrapper's patch is saved
    expect(editRequests).toHaveLength(2)
    // ...and the publish must still be sent
    expect(publishRequests).toHaveLength(1)
    subscription.unsubscribe()
  })
})
