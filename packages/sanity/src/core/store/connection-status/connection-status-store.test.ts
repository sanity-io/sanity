import {createClient} from '@sanity/client'
import {BehaviorSubject, defer, of, ReplaySubject, Subject, Subscription} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createBifurClient} from '../../config/createBifurClient'
import {createPresenceStore} from '../presence/presence-store'
import {type DocumentPresence} from '../presence/types'
import {
  type ConnectionStatus,
  createConnectionStatusStore,
  onRetry,
} from './connection-status-store'

interface Request {
  id: string
  method: string
  params: unknown
}

const sockets: TestWebSocket[] = []
const client = createClient({
  projectId: 'example',
  dataset: 'dataset',
  apiVersion: '2022-06-30',
  useCdn: false,
})

class TestWebSocket extends EventTarget {
  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSING = 2
  readonly CLOSED = 3
  readyState = this.CONNECTING
  onopen: (() => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: (() => void) | null = null
  requests: Request[] = []

  constructor() {
    super()
    sockets.push(this)
  }

  open() {
    this.readyState = this.OPEN
    this.onopen?.()
    this.receive({jsonrpc: '2.0', method: 'welcome', params: {}})
  }

  send(data: string) {
    const request: unknown = JSON.parse(data)
    if (
      typeof request !== 'object' ||
      request === null ||
      !('id' in request) ||
      typeof request.id !== 'string' ||
      !('method' in request) ||
      typeof request.method !== 'string'
    ) {
      throw new Error(`Invalid request: ${data}`)
    }
    this.requests.push({
      id: request.id,
      method: request.method,
      params: 'params' in request ? request.params : undefined,
    })
  }

  receive(message: unknown) {
    this.dispatchEvent(new MessageEvent('message', {data: JSON.stringify(message)}))
  }

  reply(method: string, result: unknown) {
    const request = this.requests.findLast((entry) => entry.method === method)
    if (!request) throw new Error(`No ${method} request`)
    this.receive({jsonrpc: '2.0', id: request.id, result})
  }

  closeFromServer(code: number) {
    this.readyState = this.CLOSED
    this.onclose?.(new CloseEvent('close', {code, reason: 'Connection closed'}))
  }

  close() {
    this.readyState = this.CLOSED
  }
}

function socketAt(index: number) {
  const socket = sockets[index]
  if (!socket) throw new Error(`Socket ${index} hasn't been created`)
  return socket
}

describe('connection status authorization rejection', () => {
  let subscriptions: Subscription

  beforeEach(() => {
    subscriptions = new Subscription()
    sockets.length = 0
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-30T12:00:00Z'))
    vi.stubGlobal('WebSocket', TestWebSocket)
  })

  afterEach(() => {
    subscriptions.unsubscribe()
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function connect(token$ = new BehaviorSubject<string | null>('rejected-token')) {
    const options = createBifurClient(client, token$)
    const store = createConnectionStatusStore(options)
    const statuses: ConnectionStatus[] = []
    subscriptions.add(store.connectionStatus$.subscribe((status) => statuses.push(status)))
    return {bifur: options.bifur, store, token$, statuses}
  }

  it('reports connecting while waiting for the initial token', () => {
    const token$ = new ReplaySubject<string | null>(1)
    const options = createBifurClient(client, token$)
    const store = createConnectionStatusStore(options)
    const statuses: ConnectionStatus[] = []
    subscriptions.add(store.connectionStatus$.subscribe((status) => statuses.push(status)))

    expect(statuses).toEqual([{type: 'connecting'}])
    token$.next('initial-token')
    socketAt(0).open()
    expect(socketAt(0).requests).toEqual([
      expect.objectContaining({
        method: 'authorization',
        params: {authorization: 'Bearer initial-token', apiVersion: 'v1'},
      }),
    ])
  })

  it('authorizes with tokens from a non-replaying stream, including after rejection', () => {
    const token$ = new Subject<string | null>()
    const options = createBifurClient(client, token$)
    const store = createConnectionStatusStore(options)
    subscriptions.add(store.connectionStatus$.subscribe())

    token$.next('initial-token')
    socketAt(0).open()
    expect(socketAt(0).requests).toEqual([
      expect.objectContaining({
        method: 'authorization',
        params: {authorization: 'Bearer initial-token', apiVersion: 'v1'},
      }),
    ])
    socketAt(0).closeFromServer(4001)

    token$.next('new-token')
    socketAt(1).open()
    expect(socketAt(1).requests).toEqual([
      expect.objectContaining({
        method: 'authorization',
        params: {authorization: 'Bearer new-token', apiVersion: 'v1'},
      }),
    ])
    socketAt(1).reply('authorization', {})
  })

  it('subscribes to a cold token producer once for status and authorization', () => {
    let tokenSubscriptions = 0
    const token$ = defer(() => {
      tokenSubscriptions++
      return of('initial-token')
    })
    const options = createBifurClient(client, token$)
    const store = createConnectionStatusStore(options)
    subscriptions.add(store.connectionStatus$.subscribe())
    socketAt(0).open()

    expect(tokenSubscriptions).toBe(1)
    expect(socketAt(0).requests).toEqual([expect.objectContaining({method: 'authorization'})])
  })

  it('stops automatic retries after welcome followed by a 4001 close', async () => {
    const {statuses, token$} = connect()
    socketAt(0).open()
    socketAt(0).closeFromServer(4001)

    await vi.advanceTimersByTimeAsync(300_000)
    window.dispatchEvent(new Event('online'))
    token$.next('rejected-token')
    await vi.advanceTimersByTimeAsync(300_000)

    expect(sockets).toHaveLength(1)
    expect(statuses.at(-1)).toMatchObject({
      type: 'error',
      error: {code: 4001},
      retryAt: null,
    })
  })

  it('retries with a new token and restores presence on the shared connection', async () => {
    const {bifur, store, token$, statuses} = connect()
    const presence = createPresenceStore({
      bifur,
      connectionStatusStore: store,
      userStore: {
        getUser: async (id) => ({id, displayName: id}),
        getUsers: async (ids) => ids.map((id) => ({id, displayName: id})),
      },
    })
    const locations: DocumentPresence[][] = []
    subscriptions.add(
      presence.documentPresence('doc-1').subscribe((value) => locations.push(value)),
    )

    socketAt(0).open()
    socketAt(0).closeFromServer(4001)
    await vi.advanceTimersByTimeAsync(1000)
    expect(sockets).toHaveLength(1)

    token$.next('valid-token')
    const recovered = socketAt(1)
    recovered.open()
    expect(recovered.requests).toEqual([
      expect.objectContaining({
        method: 'authorization',
        params: {authorization: 'Bearer valid-token', apiVersion: 'v1'},
      }),
    ])
    recovered.reply('authorization', {})
    recovered.reply('presence_subscribe', 'presence-subscription')
    recovered.receive({
      jsonrpc: '2.0',
      method: 'presence_subscription',
      params: {
        subscription: 'presence-subscription',
        result: {
          type: 'state',
          i: 'other-user',
          m: {
            sessionId: 'other-session',
            locations: [
              {
                type: 'document',
                documentId: 'doc-1',
                path: ['title'],
                lastActiveAt: '2026-10-30T12:00:00Z',
              },
            ],
          },
        },
      },
    })
    await vi.advanceTimersByTimeAsync(200)

    expect(statuses.at(-1)?.type).toBe('connected')
    expect(locations.at(-1)).toEqual([
      expect.objectContaining({
        user: {id: 'other-user', displayName: 'other-user'},
        path: ['title'],
      }),
    ])
    expect(sockets).toHaveLength(2)
    expect(recovered.requests.filter((request) => request.method === 'authorization')).toHaveLength(
      1,
    )
  })

  it('allows an explicit retry and stops again if the same token is rejected', async () => {
    connect()
    socketAt(0).open()
    socketAt(0).closeFromServer(4001)

    onRetry()
    socketAt(1).open()
    socketAt(1).closeFromServer(4001)
    await vi.advanceTimersByTimeAsync(300_000)

    expect(sockets).toHaveLength(2)
  })

  it('retries with cookie authentication when the token is cleared', () => {
    const {token$, statuses} = connect()
    socketAt(0).open()
    socketAt(0).closeFromServer(4001)

    token$.next(null)
    socketAt(1).open()

    expect(sockets).toHaveLength(2)
    expect(socketAt(1).requests).toEqual([])
    expect(statuses.at(-1)?.type).toBe('connected')
  })

  it('reauthorizes an active connection once when the token changes', () => {
    const {token$, statuses} = connect()
    const socket = socketAt(0)
    socket.open()
    socket.reply('authorization', {})

    token$.next('refreshed-token')
    socket.reply('authorization', {})

    expect(sockets).toHaveLength(1)
    expect(socket.requests.filter((request) => request.method === 'authorization')).toEqual([
      expect.objectContaining({params: {authorization: 'Bearer rejected-token', apiVersion: 'v1'}}),
      expect.objectContaining({
        params: {authorization: 'Bearer refreshed-token', apiVersion: 'v1'},
      }),
    ])
    expect(statuses.at(-1)?.type).toBe('connected')
  })

  it('allows an explicit retry when the client uses cookies', async () => {
    const store = createConnectionStatusStore(createBifurClient(client))
    subscriptions.add(store.connectionStatus$.subscribe())
    socketAt(0).open()
    socketAt(0).closeFromServer(4001)
    await vi.advanceTimersByTimeAsync(1000)
    expect(sockets).toHaveLength(1)

    onRetry()
    socketAt(1).open()
    expect(sockets).toHaveLength(2)
  })

  it('shares retries across status subscribers', async () => {
    const {store} = connect()
    const otherStatuses: ConnectionStatus[] = []
    subscriptions.add(store.connectionStatus$.subscribe((status) => otherStatuses.push(status)))
    socketAt(0).open()
    socketAt(0).closeFromServer(4001)
    await vi.advanceTimersByTimeAsync(1000)
    expect(sockets).toHaveLength(1)

    onRetry()
    const recovered = socketAt(1)
    recovered.open()
    recovered.reply('authorization', {})

    expect(sockets).toHaveLength(2)
    expect(recovered.requests.filter((request) => request.method === 'authorization')).toHaveLength(
      1,
    )
    expect(otherStatuses.at(-1)?.type).toBe('connected')
  })

  it('preserves increasing delays for transient failures without traffic', async () => {
    const {statuses} = connect()
    socketAt(0).closeFromServer(1006)
    expect(statuses.at(-1)).toMatchObject({
      type: 'error',
      attemptNo: 1,
      retryAt: new Date('2026-10-30T12:00:00.200Z'),
    })
    await vi.advanceTimersByTimeAsync(199)
    expect(sockets).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    socketAt(1).closeFromServer(1006)
    expect(statuses.at(-1)).toMatchObject({
      type: 'error',
      attemptNo: 2,
      retryAt: new Date('2026-10-30T12:00:00.600Z'),
    })
    await vi.advanceTimersByTimeAsync(399)
    expect(sockets).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(sockets).toHaveLength(3)
  })

  it('cancels retries and token observation when the last subscriber leaves', async () => {
    const {token$} = connect()
    socketAt(0).closeFromServer(1006)

    subscriptions.unsubscribe()
    token$.next('new-token')
    onRetry()
    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(300_000)

    expect(sockets).toHaveLength(1)
  })
})
