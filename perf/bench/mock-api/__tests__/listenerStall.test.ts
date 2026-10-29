// @vitest-environment node
/**
 * Fault injection for the stale-document scenario: a listener that stays
 * connected (heartbeats keep coming) but stops delivering mutation events,
 * and a peer transaction that removes a Portable Text block while the page
 * under test cannot hear it.
 */
import http from 'node:http'
import {type AddressInfo} from 'node:net'

import {createClient, type SanityClient} from '@sanity/client'
import {applyPatch} from 'mendoza'
import {filter, firstValueFrom, type Observable, ReplaySubject, take, timeout} from 'rxjs'
import {afterAll, afterEach, beforeAll, describe, expect, it} from 'vitest'

import {createMockApi, type MockApiServer} from '../createServer'
import {ListenHub} from '../sse'
import {type BenchDocument} from '../types'

const PORT = 43125
const DRAFT_ID = 'drafts.stall-doc'
const PUBLISHED_ID = 'stall-doc'

const PAIR_LISTEN_OPTIONS = {
  includeResult: false,
  includeAllVersions: true,
  enableResume: true,
  events: ['welcome', 'mutation', 'reconnect', 'reset', 'welcomeback'],
  effectFormat: 'mendoza',
  tag: 'bench.stall',
} satisfies Parameters<SanityClient['listen']>[2]

type ListenerEvent = {type: string} & Record<string, any>

function block(key: string, text: string) {
  return {
    _key: key,
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{_key: `${key}-span`, _type: 'span', marks: [], text}],
  }
}

const ARTICLE: BenchDocument = {
  _id: DRAFT_ID,
  _type: 'article',
  body: [block('first', 'Deleted by the peer'), block('second', 'Stays')],
}

describe('listener stall and peer transactions (real @sanity/client)', () => {
  let mock: MockApiServer
  let client: SanityClient

  beforeAll(async () => {
    mock = createMockApi({port: PORT, projectId: 'benchexp', dataset: 'bench'})
    await mock.listen()
    client = createClient({
      projectId: 'benchexp',
      dataset: 'bench',
      apiHost: `http://127.0.0.1:${PORT}`,
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      useProjectHostname: false,
      useCdn: false,
      apiVersion: '2025-02-19',
      token: 'bench-fake-token',
    })
  })

  afterEach(() => {
    mock.hub.closeAll()
    mock.store.reset()
    mock.ledger.reset()
  })

  afterAll(async () => {
    await mock.close()
  })

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

  function nextEvent(events$: Observable<ListenerEvent>, type: string): Promise<ListenerEvent> {
    return firstValueFrom(
      events$.pipe(
        filter((event) => event.type === type),
        take(1),
        timeout(5000),
      ),
    )
  }

  it('stalls only the connections open at the time', async () => {
    const first = listenToPair()
    try {
      await nextEvent(first.events$, 'welcome')
      expect(mock.hub.stallOpenConnections()).toBe(1)
      const second = listenToPair()
      try {
        await nextEvent(second.events$, 'welcome')
        expect(mock.hub.connectionCount).toBe(2)
        expect(mock.hub.stalledConnectionCount).toBe(1)
        mock.hub.resumeStalledConnections()
        expect(mock.hub.stalledConnectionCount).toBe(0)
      } finally {
        second.stop()
      }
    } finally {
      first.stop()
    }
  })

  it('a stalled connection misses events until resumed, and the missed ones are not replayed', async () => {
    mock.store.seed([structuredClone(ARTICLE)])
    const stalled = listenToPair()
    try {
      await nextEvent(stalled.events$, 'welcome')
      mock.hub.stallOpenConnections()

      const missed = mock.commitAsPeer([{patch: {id: DRAFT_ID, set: {title: 'missed'}}}])
      mock.hub.resumeStalledConnections()
      const delivered = mock.commitAsPeer([{patch: {id: DRAFT_ID, set: {title: 'delivered'}}}])
      // Broadcast writes to every connection in the same tick, so had the
      // first event reached the stalled connection it would arrive first
      const firstMutation = await nextEvent(stalled.events$, 'mutation')
      expect(firstMutation.transactionId).toBe(delivered.transactionId)
      expect(firstMutation.previousRev).toBe(missed.transactionId)
    } finally {
      stalled.stop()
    }
  })

  it('delivers to a connection opened after the stall', async () => {
    mock.store.seed([structuredClone(ARTICLE)])
    const stalled = listenToPair()
    try {
      await nextEvent(stalled.events$, 'welcome')
      mock.hub.stallOpenConnections()
      const fresh = listenToPair()
      try {
        await nextEvent(fresh.events$, 'welcome')
        const result = mock.commitAsPeer([{patch: {id: DRAFT_ID, set: {title: 'heard'}}}])
        expect((await nextEvent(fresh.events$, 'mutation')).transactionId).toBe(
          result.transactionId,
        )
      } finally {
        fresh.stop()
      }
    } finally {
      stalled.stop()
    }
  })

  it('removes a Portable Text block as a peer transaction with a new rev', async () => {
    mock.store.seed([structuredClone(ARTICLE)])
    const [, snapshot] = await client.getDocuments([PUBLISHED_ID, DRAFT_ID])
    const {events$, stop} = listenToPair()
    try {
      await nextEvent(events$, 'welcome')
      const result = mock.commitAsPeer([{patch: {id: DRAFT_ID, unset: ['body[_key=="first"]']}}])

      const mutation = await nextEvent(events$, 'mutation')
      expect(mutation).toMatchObject({
        documentId: DRAFT_ID,
        transactionId: result.transactionId,
        resultRev: result.transactionId,
        previousRev: 'seed',
        transition: 'update',
      })
      const serverDocument = mock.store.get(DRAFT_ID)
      expect(serverDocument?._rev).toBe(result.transactionId)
      expect((serverDocument?.body as {_key: string}[]).map((entry) => entry._key)).toEqual([
        'second',
      ])
      expect(applyPatch(snapshot, mutation.effects.apply)).toEqual(serverDocument)
    } finally {
      stop()
    }
  })

  it('accepts an edit to a removed block as a no-op, like Content Lake', async () => {
    mock.store.seed([structuredClone(ARTICLE)])
    mock.commitAsPeer([{patch: {id: DRAFT_ID, unset: ['body[_key=="first"]']}}])
    const bodyAfterDelete = mock.store.get(DRAFT_ID)?.body

    await client.action(
      [
        {
          actionType: 'sanity.action.document.edit',
          draftId: DRAFT_ID,
          publishedId: PUBLISHED_ID,
          patch: {
            diffMatchPatch: {
              'body[_key=="first"].children[_key=="first-span"].text':
                '@@ -1,4 +1,5 @@\n Dele\n+x\n',
            },
          },
        },
      ],
      {transactionId: 'bench-stall-tx-lost'},
    )

    const serverDocument = mock.store.get(DRAFT_ID)
    expect(serverDocument?._rev).toBe('bench-stall-tx-lost')
    expect(serverDocument?.body).toEqual(bodyAfterDelete)
  })
})

describe('ListenHub heartbeats while stalled', () => {
  const hub = new ListenHub({heartbeatIntervalMs: 20})
  const server = http.createServer((_req, res) => hub.connect(res, ['doc'], {}))

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  })

  afterAll(async () => {
    hub.closeAll()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('keeps sending heartbeats and no mutation events', async () => {
    const {port} = server.address() as AddressInfo
    const received: string[] = []
    const request = http.get(`http://127.0.0.1:${port}/listen`, (res) => {
      res.setEncoding('utf8')
      res.on('data', (chunk: string) => received.push(chunk))
    })
    request.on('error', () => {})
    try {
      await expect.poll(() => received.join('')).toContain('event: welcome')
      hub.stallOpenConnections()
      const before = received.length
      hub.broadcast([
        {
          documentId: 'doc',
          transactionId: 'tx-dropped',
          identity: 'bench-user',
          mutations: [],
          effects: {apply: [], revert: []},
          resultRev: 'tx-dropped',
          timestamp: new Date().toISOString(),
          transactionTotalEvents: 1,
          transactionCurrentEvent: 1,
          visibility: 'transaction',
          transition: 'update',
        },
      ])
      await expect
        .poll(() => received.slice(before).filter((chunk) => chunk === ':\n\n').length)
        .toBeGreaterThanOrEqual(2)
      expect(received.join('')).not.toContain('event: mutation')
    } finally {
      request.destroy()
    }
  })
})
