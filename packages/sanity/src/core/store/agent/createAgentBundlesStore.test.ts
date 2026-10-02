import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of} from 'rxjs'
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
    close() {}
  }
  return {FakeEventSource}
})

vi.mock('@sanity/eventsource', () => ({default: FakeEventSource}))

/** A client whose credential is only known through `getAuth()`, like one with a reactive `auth`. */
function createClient(auth: {token?: string; withCredentials?: true}): SanityClient {
  return {
    config: () => ({projectId: 'p', dataset: 'd'}),
    getUrl: (uri: string) => `https://p.api.sanity.io/v1${uri}`,
    getAuth: vi.fn(async () => auth),
  } as unknown as SanityClient
}

describe('createAgentBundlesStore', () => {
  beforeEach(() => {
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens the stream with the token the client resolves through getAuth()', async () => {
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
})
