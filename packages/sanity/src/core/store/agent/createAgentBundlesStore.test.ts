import {type SanityClient} from '@sanity/client'
import {BehaviorSubject, firstValueFrom, of} from 'rxjs'
import {filter} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createAgentBundlesStore} from './createAgentBundlesStore'

/** Records the `EventSource` constructions the store makes, as the polyfill and as the global. */
const {FakeEventSource} = vi.hoisted(() => {
  // oxlint-disable-next-line no-shadow -- hoisted so the module mock below can reference it
  class FakeEventSource {
    static instances: FakeEventSource[] = []
    listeners = new Map<string, EventListener>()
    constructor(
      public url: string,
      public init?: EventSourceInit & {headers?: Record<string, string>},
    ) {
      FakeEventSource.instances.push(this)
    }
    addEventListener(type: string, listener: EventListener) {
      this.listeners.set(type, listener)
    }
    emit(type: string, data: unknown) {
      this.listeners.get(type)?.(new MessageEvent(type, {data: JSON.stringify(data)}))
    }
    closed = false
    close() {
      this.closed = true
    }
  }
  return {FakeEventSource}
})

vi.mock('@sanity/eventsource', () => ({default: FakeEventSource}))

/** A client with a static credential. */
function createClient(auth: {token?: string; withCredentials?: true}): SanityClient {
  return {
    config: () => ({projectId: 'p', dataset: 'd', ...auth}),
    getUrl: (uri: string) => `https://p.api.sanity.io/v1${uri}`,
  } as unknown as SanityClient
}

/** A client with a reactive `auth`, which an auth store rotates by emitting the next credential. */
function createReactiveClient(token: string) {
  const auth = new BehaviorSubject<Promise<{token: string} | undefined>>(Promise.resolve({token}))
  const config = {projectId: 'p', dataset: 'd', auth}
  const client = {
    config: () => config,
    getUrl: (uri: string) => `https://p.api.sanity.io/v1${uri}`,
  } as unknown as SanityClient
  return {client, rotate: (next: string) => auth.next(Promise.resolve({token: next}))}
}

describe('createAgentBundlesStore', () => {
  beforeEach(() => {
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("opens the stream with the client's token", async () => {
    const store = createAgentBundlesStore({
      organizationId$: of('org-1'),
      client: createClient({token: 'token-1'}),
    })
    const bundles = firstValueFrom(store.state$.pipe(filter((state) => !state.loading)))

    await vi.waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    const [es] = FakeEventSource.instances
    expect(es.url).toBe('https://p.api.sanity.io/v1/agent/org-1/bundles/mine/listen')
    expect(es.init?.headers).toEqual({Authorization: 'Bearer token-1'})
    expect(es.init?.withCredentials).toBeUndefined()

    es.emit('bundles', {bundles: [{id: 'b1', applicationKey: 'k'}]})
    await expect(bundles).resolves.toEqual({
      bundles: [{id: 'b1', applicationKey: 'k'}],
      loading: false,
    })
  })

  it('sends cookies, and no header, for a cookie-authenticated client', async () => {
    const store = createAgentBundlesStore({
      organizationId$: of('org-1'),
      client: createClient({withCredentials: true}),
    })
    store.state$.subscribe()

    await vi.waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    const [es] = FakeEventSource.instances
    expect(es.init?.withCredentials).toBe(true)
    expect(es.init?.headers).toBeUndefined()
  })

  it('reopens the stream with the new token when the credential rotates', async () => {
    // The EventSource is not the client's, so it keeps the token it was opened with. After a
    // rotation the old access token is revoked, and the stream's own reconnects would fail.
    const {client, rotate} = createReactiveClient('token-1')
    const store = createAgentBundlesStore({organizationId$: of('org-1'), client})
    const subscription = store.state$.subscribe()

    await vi.waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    expect(FakeEventSource.instances[0].init?.headers).toEqual({Authorization: 'Bearer token-1'})

    rotate('token-2')

    await vi.waitFor(() => expect(FakeEventSource.instances).toHaveLength(2))
    expect(FakeEventSource.instances[0].closed).toBe(true)
    expect(FakeEventSource.instances[1].init?.headers).toEqual({Authorization: 'Bearer token-2'})
    subscription.unsubscribe()
  })

  it('keeps the stream open when the credential emits the same token again', async () => {
    const {client, rotate} = createReactiveClient('token-1')
    const store = createAgentBundlesStore({organizationId$: of('org-1'), client})
    const subscription = store.state$.subscribe()

    await vi.waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    rotate('token-1')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(FakeEventSource.instances).toHaveLength(1)
    expect(FakeEventSource.instances[0].closed).toBe(false)
    subscription.unsubscribe()
  })
})
