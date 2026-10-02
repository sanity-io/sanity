import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {firstValueFrom, lastValueFrom, take, toArray} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getAuthTokenStorageKey, getCookieAuthStateKey} from '../constants'
import {probeClassicAuth} from '../probeClassicAuth'

// Match the convention from createClassicAuthStore.test.ts: ensure localStorage is
// considered supported in the test environment so the token-attribution code
// path is exercised.
vi.mock('../../../../util/supportsLocalStorage', () => ({
  supportsLocalStorage: true,
}))

interface MockFactoryOptions {
  authenticated?: boolean
  // Override per-call behaviour for /auth/id, e.g. simulate transient errors
  authIdImpl?: (config: SanityClientConfig) => Promise<unknown>
}

interface MockFactory {
  factory: (options: SanityClientConfig) => SanityClient
  callCount: () => number
  configs: () => SanityClientConfig[]
}

function create401Error(): Error & {statusCode: number} {
  const err = new Error('Unauthorized') as Error & {statusCode: number}
  err.statusCode = 401
  return err
}

function createMockFactory({
  authenticated = true,
  authIdImpl,
}: MockFactoryOptions = {}): MockFactory {
  let calls = 0
  const configs: SanityClientConfig[] = []

  const factory = (config: SanityClientConfig): SanityClient => {
    configs.push(config)
    return {
      request: vi.fn(({url}: {url: string}) => {
        if (url === '/auth/id') {
          calls++
          if (authIdImpl) return authIdImpl(config)
          if (authenticated) {
            return Promise.resolve({id: 'mock-id', expiry: 0})
          }
          return Promise.reject(create401Error())
        }
        return Promise.resolve({})
      }),
    } as unknown as SanityClient
  }

  return {
    factory,
    callCount: () => calls,
    configs: () => configs,
  }
}

describe('probeClassicAuth', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear()
  })

  it('emits the user id on a 200 response', async () => {
    const mock = createMockFactory({authenticated: true})
    const result = await firstValueFrom(
      probeClassicAuth({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
    )
    expect(result).toBe('mock-id')
  })

  it('emits undefined on a 401 response', async () => {
    const mock = createMockFactory({authenticated: false})
    const result = await firstValueFrom(
      probeClassicAuth({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
    )
    expect(result).toBeUndefined()
  })

  it('treats non-401 errors as unauthenticated (fails open)', async () => {
    // A transient failure (network blip, 5xx, CORS misconfig) should not
    // tear down the studio via React's error boundary. The probe degrades
    // to `undefined` and logs a warning.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mock = createMockFactory({
      authIdImpl: () => Promise.reject(new Error('boom')),
    })

    const result = await firstValueFrom(
      probeClassicAuth({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
    )

    expect(result).toBeUndefined()
    expect(warnSpy).toHaveBeenCalledOnce()
    warnSpy.mockRestore()
  })

  it('shares one request between workspaces of a project checked at the same time', async () => {
    const mock = createMockFactory({authenticated: true})
    const answers = await Promise.all([
      firstValueFrom(
        probeClassicAuth({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
      ),
      firstValueFrom(
        probeClassicAuth({projectId: 'p1', dataset: 'd2'}, {clientFactory: mock.factory}),
      ),
    ])

    expect(answers).toEqual(['mock-id', 'mock-id'])
    expect(mock.callCount()).toBe(1)
  })

  it('does not share requests between projects', async () => {
    const mock = createMockFactory({authenticated: true})
    await Promise.all([
      firstValueFrom(
        probeClassicAuth({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
      ),
      firstValueFrom(
        probeClassicAuth({projectId: 'p2', dataset: 'd1'}, {clientFactory: mock.factory}),
      ),
    ])

    expect(mock.callCount()).toBe(2)
  })

  it('does not reuse an answer for a later ask', async () => {
    const mock = createMockFactory({authenticated: true})
    await firstValueFrom(
      probeClassicAuth({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
    )
    await firstValueFrom(
      probeClassicAuth({projectId: 'p1', dataset: 'd2'}, {clientFactory: mock.factory}),
    )

    expect(mock.callCount()).toBe(2)
  })

  it('does not retry a failed request', async () => {
    const mock = createMockFactory({authenticated: true})
    await firstValueFrom(
      probeClassicAuth({projectId: 'p-no-retry', dataset: 'd1'}, {clientFactory: mock.factory}),
    )
    expect(mock.configs()[0].maxRetries).toBe(0)
  })

  it('uses cookie auth (withCredentials) when no token is in localStorage', async () => {
    const mock = createMockFactory({authenticated: true})
    const probe$ = probeClassicAuth({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory})
    await firstValueFrom(probe$)

    const config = mock.configs()[0]
    expect(config.withCredentials).toBe(true)
    expect(config.token).toBeUndefined()
  })

  it('uses token auth when a token is present in localStorage', async () => {
    localStorage.setItem(getAuthTokenStorageKey('p1'), JSON.stringify({token: 'mock-token-abc'}))

    const mock = createMockFactory({authenticated: true})
    const probe$ = probeClassicAuth({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory})
    await firstValueFrom(probe$)

    const config = mock.configs()[0]
    expect(config.token).toBe('mock-token-abc')
    expect(config.withCredentials).toBeUndefined()
  })

  it('does not write to localStorage when probing', async () => {
    const writeSpy = vi.spyOn(Storage.prototype, 'setItem')
    const mock = createMockFactory({authenticated: true})

    await firstValueFrom(
      probeClassicAuth({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
    )

    // The probe is independent of the full AuthStore: it only reads
    // localStorage to detect a token, and never writes auth state.
    expect(writeSpy).not.toHaveBeenCalled()
    writeSpy.mockRestore()
  })

  it('asks with the token stored at the time of asking', async () => {
    // A project of its own: probes from earlier tests stay subscribed through their grace window
    // and would share this test's requests.
    const mock = createMockFactory({authenticated: true})
    const probe$ = probeClassicAuth(
      {projectId: 'p-token-switch', dataset: 'd1'},
      {clientFactory: mock.factory},
    )
    const subscription = probe$.subscribe()
    await vi.waitFor(() => expect(mock.callCount()).toBe(1))
    expect(mock.configs()[0].withCredentials).toBe(true)

    // Another tab signs in with a token.
    const key = getAuthTokenStorageKey('p-token-switch')
    localStorage.setItem(key, JSON.stringify({token: 'tok'}))
    window.dispatchEvent(new StorageEvent('storage', {key}))

    await vi.waitFor(() => expect(mock.callCount()).toBe(2))
    expect(mock.configs()[1].token).toBe('tok')
    subscription.unsubscribe()
  })

  it('re-probes a cookie probe when the cookie auth broadcast emits', async () => {
    // Simulates another tab logging in (or out): the active workspace's
    // AuthStore broadcasts on the cookie auth state channel after its
    // /users/me probe. The probe should react with a fresh /auth/id call.
    let authed = true
    const mock = createMockFactory({
      authIdImpl: () =>
        authed ? Promise.resolve({id: 'mock-id', expiry: 0}) : Promise.reject(create401Error()),
    })

    const probe$ = probeClassicAuth(
      {projectId: 'p-cookie', dataset: 'd1'},
      {clientFactory: mock.factory},
    )
    // Collect the first emission and one more after the broadcast.
    const collected = lastValueFrom(probe$.pipe(take(2), toArray()))

    // Wait for the initial probe to land before broadcasting.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mock.callCount()).toBe(1)

    // Flip the mock so the next probe yields a different result that passes
    // distinctUntilChanged downstream.
    authed = false

    // A sibling tab broadcasts on the per-project channel.
    const channel = new BroadcastChannel(getCookieAuthStateKey('p-cookie'))
    channel.postMessage(JSON.stringify(undefined))
    channel.close()

    const emissions = await collected
    // One initial probe + one re-probe triggered by the broadcast.
    expect(mock.callCount()).toBe(2)
    expect(emissions).toEqual(['mock-id', undefined])
  })

  it('does not re-probe a token probe when the cookie auth broadcast emits', async () => {
    // Token-only probes are independent of cookie state. A cookie-state
    // broadcast for the same project must not trigger a re-probe.
    localStorage.setItem(getAuthTokenStorageKey('p-token'), JSON.stringify({token: 'tok'}))

    const mock = createMockFactory({authenticated: true})
    const probe$ = probeClassicAuth(
      {projectId: 'p-token', dataset: 'd1'},
      {clientFactory: mock.factory},
    )

    // Subscribe so the probe is active and listening.
    const sub = probe$.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mock.callCount()).toBe(1)

    const channel = new BroadcastChannel(getCookieAuthStateKey('p-token'))
    channel.postMessage(JSON.stringify('mock-id'))
    channel.close()
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Still 1: the broadcast was ignored.
    expect(mock.callCount()).toBe(1)
    sub.unsubscribe()
  })
})
