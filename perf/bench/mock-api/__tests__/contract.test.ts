// @vitest-environment node
/**
 * The SSE/actions contract test — a real @sanity/client pointed at the mock,
 * subscribing with the exact listen options the studio's pair listener uses
 * (packages/sanity/src/core/store/document/getPairListener.ts). If this
 * passes, the mock speaks enough Content Lake for the form to boot, edit,
 * and stay in sync.
 */
import {createClient, type SanityClient} from '@sanity/client'
import {applyPatch} from 'mendoza'
import {filter, firstValueFrom, type Observable, ReplaySubject, take, timeout} from 'rxjs'
import {afterAll, afterEach, beforeAll, describe, expect, it} from 'vitest'

import {createMockApi, type MockApiServer} from '../createServer'

const PORT = 43121
const DRAFT_ID = 'drafts.contract-doc'
const PUBLISHED_ID = 'contract-doc'

const PAIR_LISTEN_OPTIONS = {
  includeResult: false,
  includeAllVersions: true,
  enableResume: true,
  events: ['welcome', 'mutation', 'reconnect', 'reset', 'welcomeback'],
  effectFormat: 'mendoza',
  tag: 'bench.contract',
} satisfies Parameters<SanityClient['listen']>[2]

type ListenerEvent = {type: string} & Record<string, any>

describe('mock Content Lake contract (real @sanity/client)', () => {
  let mock: MockApiServer
  let client: SanityClient

  beforeAll(async () => {
    mock = createMockApi({port: PORT, projectId: 'benchexp', dataset: 'bench'})
    await mock.listen()
    client = createClient({
      projectId: 'benchexp',
      dataset: 'bench',
      apiHost: `http://127.0.0.1:${PORT}`,
      useProjectHostname: false,
      useCdn: false,
      apiVersion: '2025-02-19',
      token: 'bench-fake-token',
    })
  })

  afterEach(() => {
    mock.hub.closeAll()
    mock.store.reset()
    // Keep the unexpected-endpoint assertion below order-independent
    mock.ledger.reset()
  })

  afterAll(async () => {
    await mock.close()
  })

  /** Subscribe like the pair listener and replay everything received. */
  function listenToPair(): {events$: Observable<ListenerEvent>; stop: () => void} {
    const events$ = new ReplaySubject<ListenerEvent>()
    const subscription = (
      client.observable.listen(
        `*[_id in $ids]`,
        {ids: [PUBLISHED_ID, DRAFT_ID]},
        PAIR_LISTEN_OPTIONS,
      ) as Observable<ListenerEvent>
    ).subscribe(events$)
    return {events$, stop: () => subscription.unsubscribe()}
  }

  function nextEvent(
    events$: Observable<ListenerEvent>,
    type: string,
    ms = 5000,
  ): Promise<ListenerEvent> {
    return firstValueFrom(
      events$.pipe(
        filter((ev) => ev.type === type),
        take(1),
        timeout(ms),
      ),
    )
  }

  it('emits welcome first on subscription', async () => {
    const {events$, stop} = listenToPair()
    try {
      const welcome = await nextEvent(events$, 'welcome')
      expect(welcome.listenerName).toMatch(/^bench-listener-/)
    } finally {
      stop()
    }
  })

  it('serves document snapshots via getDocuments', async () => {
    mock.store.seed([{_id: DRAFT_ID, _type: 'singleString', stringField: 'hello'}])
    const [published, draft] = await client.getDocuments([PUBLISHED_ID, DRAFT_ID])
    expect(published).toBeNull()
    expect(draft).toMatchObject({_id: DRAFT_ID, stringField: 'hello', _rev: 'seed'})
  })

  it('echoes an action as a mutation event with the submitted transactionId, rev-chained from the snapshot', async () => {
    mock.store.seed([{_id: DRAFT_ID, _type: 'singleString', stringField: 'hello'}])
    const [, snapshot] = await client.getDocuments([PUBLISHED_ID, DRAFT_ID])

    const {events$, stop} = listenToPair()
    try {
      await nextEvent(events$, 'welcome')

      const transactionId = 'bench-contract-tx-1'
      await client.action(
        [
          {
            actionType: 'sanity.action.document.edit',
            draftId: DRAFT_ID,
            publishedId: PUBLISHED_ID,
            patch: {set: {stringField: 'hello world'}},
          },
        ],
        {transactionId, tag: 'bench.contract'},
      )

      const mutation = await nextEvent(events$, 'mutation')
      expect(mutation).toMatchObject({
        documentId: DRAFT_ID,
        transactionId,
        resultRev: transactionId,
        previousRev: snapshot!._rev,
        transition: 'update',
        transactionTotalEvents: 1,
        transactionCurrentEvent: 1,
        visibility: 'transaction',
      })
      expect(Array.isArray(mutation.mutations)).toBe(true)

      // The mendoza effects must round-trip: snapshot + apply === server state
      const serverDocument = mock.store.get(DRAFT_ID)
      expect(applyPatch(snapshot, mutation.effects.apply)).toEqual(serverDocument)
      expect(serverDocument?.stringField).toBe('hello world')
    } finally {
      stop()
    }
  })

  it('materializes a missing draft from the published document on edit', async () => {
    mock.store.seed([{_id: PUBLISHED_ID, _type: 'singleString', stringField: 'published text'}])
    const {events$, stop} = listenToPair()
    try {
      await nextEvent(events$, 'welcome')
      await client.action(
        [
          {
            actionType: 'sanity.action.document.edit',
            draftId: DRAFT_ID,
            publishedId: PUBLISHED_ID,
            patch: {set: {stringField: 'edited'}},
          },
        ],
        {transactionId: 'bench-contract-tx-2'},
      )
      const mutation = await nextEvent(events$, 'mutation')
      // The draft did not exist: the event must be an `appear` with NO
      // previousRev (the sequentializer chains undefined → resultRev for
      // nonexistent documents — sequentializeListenerEvents.ts)
      expect(mutation.transition).toBe('appear')
      expect('previousRev' in mutation).toBe(false)
      expect(mock.store.get(DRAFT_ID)).toMatchObject({
        _type: 'singleString',
        stringField: 'edited',
      })
    } finally {
      stop()
    }
  })

  it('echoes raw mutate transactions (live-edit path)', async () => {
    mock.store.seed([{_id: PUBLISHED_ID, _type: 'singleString', stringField: 'live'}])
    const {events$, stop} = listenToPair()
    try {
      await nextEvent(events$, 'welcome')
      const transactionId = 'bench-contract-tx-3'
      await client
        .transaction()
        .patch(PUBLISHED_ID, {set: {stringField: 'live edited'}})
        .commit({visibility: 'async', returnDocuments: false, transactionId})
      const mutation = await nextEvent(events$, 'mutation')
      expect(mutation).toMatchObject({
        documentId: PUBLISHED_ID,
        transactionId,
        resultRev: transactionId,
        previousRev: 'seed',
      })
    } finally {
      stop()
    }
  })

  it('evaluates GROQ queries over the store', async () => {
    mock.store.seed([
      {_id: 'a', _type: 'singleString', stringField: 'one'},
      {_id: 'b', _type: 'other'},
    ])
    const result = await client.fetch(`*[_type == $type]{_id}`, {type: 'singleString'})
    expect(result).toEqual([{_id: 'a'}])
  })

  it('serves the global catch-all listener (preview store)', async () => {
    const events$ = new ReplaySubject<ListenerEvent>()
    const subscription = (
      client.observable.listen(
        `*[!(_id in path('_.**'))]`,
        {},
        {
          events: ['welcome', 'mutation'],
          includeResult: false,
          includeMutations: false,
          visibility: 'query',
          effectFormat: 'mendoza',
          tag: 'bench.contract.global',
        },
      ) as Observable<ListenerEvent>
    ).subscribe(events$)
    try {
      await nextEvent(events$, 'welcome')
      mock.hub.broadcast(
        mock.store.commit([{createIfNotExists: {_id: 'any-doc', _type: 'whatever'}}], 'tx-g')
          .events,
      )
      const mutation = await nextEvent(events$, 'mutation')
      expect(mutation.documentId).toBe('any-doc')
    } finally {
      subscription.unsubscribe()
    }
  })

  it('does NOT deliver mutation events for documents outside the $ids subscription', async () => {
    const {events$, stop} = listenToPair()
    try {
      await nextEvent(events$, 'welcome')
      // Broadcast for an unrelated document first, then for a subscribed
      // one: if id-filtering regressed, the unrelated event would arrive
      // first and fail the assertion below
      mock.hub.broadcast(
        mock.store.commit([{createIfNotExists: {_id: 'unrelated-doc', _type: 'other'}}], 'tx-f1')
          .events,
      )
      mock.hub.broadcast(
        mock.store.commit([{createIfNotExists: {_id: DRAFT_ID, _type: 'singleString'}}], 'tx-f2')
          .events,
      )
      const mutation = await nextEvent(events$, 'mutation')
      expect(mutation.documentId).toBe(DRAFT_ID)
      expect(mutation.transactionId).toBe('tx-f2')
    } finally {
      stop()
    }
  })

  it('removes disconnected listeners from the hub', async () => {
    const {events$, stop} = listenToPair()
    await nextEvent(events$, 'welcome')
    await expect.poll(() => mock.hub.connectionCount).toBeGreaterThan(0)
    stop()
    // The client abort propagates to the response 'close' teardown
    await expect.poll(() => mock.hub.connectionCount).toBe(0)
  })

  it('records unexpected endpoints in the ledger', async () => {
    await client.request({url: '/some/unknown/endpoint'}).catch(() => undefined)
    const {unexpected} = mock.ledger.snapshot()
    expect(unexpected).toHaveLength(1)
    expect(unexpected[0].path).toContain('/some/unknown/endpoint')
  })
})
