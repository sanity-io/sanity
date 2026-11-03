import {RpcError, WebSocketError} from '@sanity/bifur-client'
import {createClient} from '@sanity/client'
import {BehaviorSubject, type Observable, ReplaySubject, Subscription} from 'rxjs'
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
    this.receive({jsonrpc: '2.0', id: this.lastRequest(method).id, result})
  }

  replyError(method: string, code: number) {
    this.receive({jsonrpc: '2.0', id: this.lastRequest(method).id, error: {code, message: 'Nope'}})
  }

  lastRequest(method: string) {
    const request = this.requests.findLast((entry) => entry.method === method)
    if (!request) throw new Error(`No ${method} request`)
    return request
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

/**
 * Lets bifur send what it authorizes with. Its credential is a promise per value (`auth`), so the
 * `authorization` request goes out a microtask after the socket opens or the token changes.
 */
const flushAuthorization = () => vi.advanceTimersByTimeAsync(0)

const authorizations = (socket: TestWebSocket) =>
  socket.requests
    .filter((request) => request.method === 'authorization')
    .map((request) => request.params)

const bearer = (token: string) => ({authorization: `Bearer ${token}`, apiVersion: 'v1'})

describe('connection status', () => {
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

  function connect(token$: Observable<string | null> = new BehaviorSubject('rejected-token')) {
    const bifur = createBifurClient(client, token$)
    const options = {bifur, token$}
    const store = createConnectionStatusStore(options)
    const statuses: ConnectionStatus[] = []
    subscriptions.add(store.connectionStatus$.subscribe((status) => statuses.push(status)))
    return {bifur, store, statuses}
  }

  /** Opens the socket and lets bifur send its `authorization` request. */
  async function openSocket(index: number) {
    const socket = socketAt(index)
    socket.open()
    await flushAuthorization()
    return socket
  }

  it('reports connecting while waiting for the initial token', async () => {
    const token$ = new ReplaySubject<string | null>(1)
    const {statuses} = connect(token$)

    expect(statuses).toEqual([{type: 'connecting'}])
    token$.next('initial-token')
    await flushAuthorization()
    const socket = await openSocket(0)
    expect(authorizations(socket)).toEqual([bearer('initial-token')])
    socket.reply('authorization', {})
    expect(statuses.at(-1)?.type).toBe('connected')
  })

  it('stops retrying after the server closes the socket on a rejected token', async () => {
    const {statuses} = connect()
    // The server welcomes every socket before it checks the token. The welcome must not count as
    // a connection, or the rejection would look like a new failure every time.
    const socket = await openSocket(0)
    expect(authorizations(socket)).toEqual([bearer('rejected-token')])
    socket.closeFromServer(4001)

    const status = statuses.at(-1)
    expect(status).toMatchObject({type: 'error', attemptNo: 1, retryAt: null})
    expect(status?.type === 'error' && status.error).toBeInstanceOf(WebSocketError)
    await vi.advanceTimersByTimeAsync(300_000)
    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(300_000)
    expect(sockets).toHaveLength(1)
    expect(statuses.some((s) => s.type === 'connected')).toBe(false)
  })

  it('stops retrying after the server rejects the authorization request', async () => {
    const {statuses} = connect()
    ;(await openSocket(0)).replyError('authorization', 4001)

    const status = statuses.at(-1)
    expect(status).toMatchObject({type: 'error', attemptNo: 1, retryAt: null})
    expect(status?.type === 'error' && status.error).toBeInstanceOf(RpcError)
    expect(status?.type === 'error' && status.error).toMatchObject({code: 4001})
    await vi.advanceTimersByTimeAsync(300_000)
    expect(sockets).toHaveLength(1)
  })

  it('connects right away with a new token after a rejection', async () => {
    const token$ = new BehaviorSubject<string | null>('rejected-token')
    const {statuses} = connect(token$)
    ;(await openSocket(0)).closeFromServer(4001)

    token$.next('valid-token')
    await flushAuthorization()
    expect(sockets).toHaveLength(2)
    const recovered = await openSocket(1)
    expect(authorizations(recovered)).toEqual([bearer('valid-token')])
    recovered.reply('authorization', {})
    expect(statuses.at(-1)?.type).toBe('connected')
  })

  it('retries a renewed token once when it is rejected, then stops', async () => {
    const token$ = new BehaviorSubject<string | null>('rejected-token')
    const {statuses} = connect(token$)
    ;(await openSocket(0)).closeFromServer(4001)

    token$.next('also-rejected-token')
    await flushAuthorization()
    ;(await openSocket(1)).closeFromServer(4001)
    expect(statuses.at(-1)).toMatchObject({type: 'error', attemptNo: 1})
    await vi.advanceTimersByTimeAsync(200)
    ;(await openSocket(2)).closeFromServer(4001)
    expect(statuses.at(-1)).toMatchObject({type: 'error', attemptNo: 2, retryAt: null})

    await vi.advanceTimersByTimeAsync(300_000)
    expect(sockets).toHaveLength(3)
  })

  it('stays stopped when the same token is emitted again', async () => {
    const token$ = new BehaviorSubject<string | null>('rejected-token')
    connect(token$)
    ;(await openSocket(0)).closeFromServer(4001)

    token$.next('rejected-token')
    await vi.advanceTimersByTimeAsync(300_000)
    expect(sockets).toHaveLength(1)
  })

  it('recovers when a new token arrives just before the server closes the socket on the old one', async () => {
    const token$ = new BehaviorSubject<string | null>('rejected-token')
    const {statuses} = connect(token$)
    const socket = await openSocket(0)

    // The new token is sent on the open socket, but the server already rejected the old one
    token$.next('valid-token')
    await flushAuthorization()
    socket.closeFromServer(4001)

    await vi.advanceTimersByTimeAsync(200)
    const recovered = await openSocket(1)
    expect(authorizations(recovered)).toEqual([bearer('valid-token')])
    recovered.reply('authorization', {})
    expect(statuses.at(-1)?.type).toBe('connected')
  })

  it('restores presence on the shared connection once a new token is accepted', async () => {
    const token$ = new BehaviorSubject<string | null>('rejected-token')
    const {bifur, store, statuses} = connect(token$)
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

    ;(await openSocket(0)).closeFromServer(4001)
    token$.next('valid-token')
    await vi.advanceTimersByTimeAsync(200)
    const recovered = await openSocket(1)
    expect(authorizations(recovered)).toEqual([bearer('valid-token')])
    recovered.reply('authorization', {})
    await flushAuthorization()
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
    expect(authorizations(recovered)).toHaveLength(1)
  })

  it('retries with cookie authentication when the token is cleared', async () => {
    const token$ = new BehaviorSubject<string | null>('rejected-token')
    const {statuses} = connect(token$)
    ;(await openSocket(0)).closeFromServer(4001)

    token$.next(null)
    await vi.advanceTimersByTimeAsync(200)
    const recovered = await openSocket(1)

    expect(sockets).toHaveLength(2)
    expect(recovered.requests).toEqual([])
    expect(statuses.at(-1)?.type).toBe('connected')
  })

  it('reauthorizes an active connection once when the token changes', async () => {
    const token$ = new BehaviorSubject<string | null>('initial-token')
    const {statuses} = connect(token$)
    const socket = await openSocket(0)
    socket.reply('authorization', {})

    token$.next('refreshed-token')
    await flushAuthorization()
    socket.reply('authorization', {})

    expect(sockets).toHaveLength(1)
    expect(authorizations(socket)).toEqual([bearer('initial-token'), bearer('refreshed-token')])
    expect(statuses.at(-1)?.type).toBe('connected')
  })

  it('does not reauthorize when the same token is emitted again', async () => {
    // The auth store emits its token again on every update and cross-tab broadcast
    const token$ = new BehaviorSubject<string | null>('initial-token')
    connect(token$)
    const socket = await openSocket(0)
    socket.reply('authorization', {})

    token$.next('initial-token')
    await flushAuthorization()

    expect(authorizations(socket)).toEqual([bearer('initial-token')])
  })

  it('allows an explicit retry, and stops again if the same token is rejected', async () => {
    connect()
    ;(await openSocket(0)).closeFromServer(4001)
    expect(sockets).toHaveLength(1)

    onRetry()
    expect(sockets).toHaveLength(2)
    ;(await openSocket(1)).closeFromServer(4001)
    await vi.advanceTimersByTimeAsync(300_000)
    expect(sockets).toHaveLength(2)
  })

  it('shares one retry cycle between status subscribers', async () => {
    const token$ = new BehaviorSubject<string | null>('rejected-token')
    const {store, statuses} = connect(token$)
    const otherStatuses: ConnectionStatus[] = []
    subscriptions.add(store.connectionStatus$.subscribe((status) => otherStatuses.push(status)))
    ;(await openSocket(0)).closeFromServer(4001)

    token$.next('valid-token')
    await vi.advanceTimersByTimeAsync(200)
    expect(sockets).toHaveLength(2)
    const recovered = await openSocket(1)
    recovered.reply('authorization', {})

    expect(sockets).toHaveLength(2)
    expect(authorizations(recovered)).toEqual([bearer('valid-token')])
    expect(statuses.at(-1)?.type).toBe('connected')
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

  it('cancels retries when the last subscriber leaves', async () => {
    const token$ = new BehaviorSubject<string | null>('rejected-token')
    connect(token$)
    ;(await openSocket(0)).closeFromServer(4001)

    subscriptions.unsubscribe()
    token$.next('new-token')
    onRetry()
    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(300_000)

    expect(sockets).toHaveLength(1)
  })
})
