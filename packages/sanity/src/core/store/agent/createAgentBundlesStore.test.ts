import {type Auth, createClient} from '@sanity/client'
import {BehaviorSubject, of} from 'rxjs'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {createAgentBundlesStore} from './createAgentBundlesStore'

const {connections, FakeEventSource} = vi.hoisted(() => {
  const opened: {
    init: EventSourceInit & {headers?: Record<string, string>}
    polyfill: boolean
    closed: boolean
  }[] = []

  const createFake = (polyfill: boolean) =>
    class {
      connection: (typeof opened)[number]
      constructor(_url: string, init: EventSourceInit & {headers?: Record<string, string>}) {
        this.connection = {init, polyfill, closed: false}
        opened.push(this.connection)
      }
      addEventListener() {}
      close() {
        this.connection.closed = true
      }
    }

  return {
    connections: opened,
    FakeEventSource: {native: createFake(false), polyfill: createFake(true)},
  }
})

vi.mock('@sanity/eventsource', () => ({default: FakeEventSource.polyfill}))

const baseConfig = {
  apiVersion: '2025-02-19',
  ignoreBrowserTokenWarning: true,
  projectId: 'abc123',
  useCdn: false,
}

async function openConnection(clientConfig: {token?: string; withCredentials?: boolean}) {
  vi.stubGlobal('EventSource', FakeEventSource.native)
  const client = createClient({...baseConfig, ...clientConfig})
  const {state$} = createAgentBundlesStore({client, organizationId$: of('org-1')})
  const subscription = state$.subscribe()

  await vi.waitFor(() => expect(connections).toHaveLength(1))
  subscription.unsubscribe()

  return connections[0]
}

/** A client with a reactive `auth`, which an auth store rotates by emitting the next credential. */
function createReactiveClient(token: string) {
  const auth = new BehaviorSubject<Promise<Auth | undefined>>(Promise.resolve({token}))
  const client = createClient({...baseConfig, auth})
  return {client, rotate: (next: string) => auth.next(Promise.resolve({token: next}))}
}

afterEach(() => {
  connections.length = 0
  vi.unstubAllGlobals()
})

describe('createAgentBundlesStore', () => {
  test('authenticates a token client with the token alone, without cookies', async () => {
    const {init, polyfill} = await openConnection({token: 'sk-token'})

    expect(polyfill).toBe(true)
    expect(init.headers).toEqual({Authorization: 'Bearer sk-token'})
    expect(init.withCredentials).toBeUndefined()
  })

  test('sends cookies when the client is configured with credentials', async () => {
    const {init, polyfill} = await openConnection({withCredentials: true})

    expect(polyfill).toBe(false)
    expect(init.withCredentials).toBe(true)
    expect(init.headers).toBeUndefined()
  })

  test('reopens the stream with the new token when the credential rotates', async () => {
    // The EventSource is not the client's, so it keeps the token it was opened with. After a
    // rotation the old access token is revoked, and the stream's own reconnects would fail.
    const {client, rotate} = createReactiveClient('token-1')
    const {state$} = createAgentBundlesStore({client, organizationId$: of('org-1')})
    const subscription = state$.subscribe()

    await vi.waitFor(() => expect(connections).toHaveLength(1))
    expect(connections[0].init.headers).toEqual({Authorization: 'Bearer token-1'})

    rotate('token-2')

    await vi.waitFor(() => expect(connections).toHaveLength(2))
    expect(connections[0].closed).toBe(true)
    expect(connections[1].init.headers).toEqual({Authorization: 'Bearer token-2'})
    subscription.unsubscribe()
  })

  test('keeps the stream open when the credential emits the same token again', async () => {
    const {client, rotate} = createReactiveClient('token-1')
    const {state$} = createAgentBundlesStore({client, organizationId$: of('org-1')})
    const subscription = state$.subscribe()

    await vi.waitFor(() => expect(connections).toHaveLength(1))
    rotate('token-1')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(connections).toHaveLength(1)
    expect(connections[0].closed).toBe(false)
    subscription.unsubscribe()
  })
})
