import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {firstValueFrom, lastValueFrom, take, toArray} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, onTestFinished, vi} from 'vitest'

import {createBroadcastState} from '../../utils/createBroadcastState'
import {getAuthTokenStorageKey, getCookieAuthStateKey} from '../constants'
import {createBroadcastStorage} from '../createBroadcastStorage'
import {type CurrentUserIdInput, observeCurrentUserId} from '../currentUserId'

// Match the convention from createLegacyAuthStore.test.ts: ensure localStorage is
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

// The token storage and cookie auth state of a store for `projectId`, built the way the store
// builds them, so tests can write to them as the store would.
function createStoreStates(projectId: string) {
  const tokenState = createBroadcastStorage<{token?: string}>(
    getAuthTokenStorageKey(projectId),
    (current) => current,
  )
  const cookieState = createBroadcastState<{authenticated: boolean | 'pending'}>(
    getCookieAuthStateKey(projectId),
    () => ({authenticated: 'pending'}),
  )
  openStates.push(tokenState, cookieState)
  return {tokenState, cookieState}
}
const openStates: {dispose: () => void}[] = []

function checkFor(
  input: Omit<CurrentUserIdInput, 'tokenState' | 'cookieState'>,
  options: Parameters<typeof observeCurrentUserId>[1],
  states = createStoreStates(input.projectId),
) {
  return observeCurrentUserId({...input, ...states}, options)
}

describe('observeCurrentUserId', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear()
  })

  afterEach(() => {
    for (const state of openStates.splice(0)) state.dispose()
  })

  it('emits the user id on a 200 response', async () => {
    const mock = createMockFactory({authenticated: true})
    const result = await firstValueFrom(
      checkFor({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
    )
    expect(result).toBe('mock-id')
  })

  it('emits undefined on a 401 response', async () => {
    const mock = createMockFactory({authenticated: false})
    const result = await firstValueFrom(
      checkFor({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
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
      checkFor({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
    )

    expect(result).toBeUndefined()
    expect(warnSpy).toHaveBeenCalledOnce()
    warnSpy.mockRestore()
  })

  it('says which request failed in the warning, without the token', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(
      getAuthTokenStorageKey('p-warn'),
      JSON.stringify({token: 'secret-token', time: new Date().toISOString()}),
    )
    const mock = createMockFactory({
      authIdImpl: () => Promise.reject(new TypeError('Failed to fetch')),
    })

    await firstValueFrom(
      checkFor(
        {projectId: 'p-warn', dataset: 'd1', apiHost: 'https://api.sanity.work'},
        {clientFactory: mock.factory},
      ),
    )

    const message = String(warnSpy.mock.calls[0]?.[0])
    expect(message).toContain('"p-warn"')
    expect(message).toContain('https://p-warn.api.sanity.work')
    expect(message).toContain('/auth/id')
    expect(message).toContain('token')
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain('secret-token')
    warnSpy.mockRestore()
  })

  it('shares one request between workspaces of a project checked at the same time', async () => {
    const mock = createMockFactory({authenticated: true})
    const answers = await Promise.all([
      firstValueFrom(checkFor({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory})),
      firstValueFrom(checkFor({projectId: 'p1', dataset: 'd2'}, {clientFactory: mock.factory})),
    ])

    expect(answers).toEqual(['mock-id', 'mock-id'])
    expect(mock.callCount()).toBe(1)
  })

  it('does not share requests between projects', async () => {
    const mock = createMockFactory({authenticated: true})
    await Promise.all([
      firstValueFrom(checkFor({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory})),
      firstValueFrom(checkFor({projectId: 'p2', dataset: 'd1'}, {clientFactory: mock.factory})),
    ])

    expect(mock.callCount()).toBe(2)
  })

  it('does not reuse an answer for a later ask', async () => {
    const mock = createMockFactory({authenticated: true})
    await firstValueFrom(checkFor({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}))
    await firstValueFrom(checkFor({projectId: 'p1', dataset: 'd2'}, {clientFactory: mock.factory}))

    expect(mock.callCount()).toBe(2)
  })

  it('keeps the answer for 30 seconds after the last unsubscribe', async () => {
    vi.useFakeTimers()
    onTestFinished(() => {
      vi.useRealTimers()
    })
    const mock = createMockFactory({authenticated: true})
    const probe$ = checkFor(
      {projectId: 'p-keep-alive', dataset: 'd1'},
      {clientFactory: mock.factory},
    )

    await firstValueFrom(probe$)
    await firstValueFrom(probe$)
    expect(mock.callCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(29_000)
    await firstValueFrom(probe$)
    expect(mock.callCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(30_000)
    await firstValueFrom(probe$)
    expect(mock.callCount()).toBe(2)
  })

  it('does not share requests between API hosts', async () => {
    const mock = createMockFactory({authenticated: true})
    await Promise.all([
      firstValueFrom(
        checkFor(
          {projectId: 'p1', dataset: 'd1', apiHost: 'https://api.sanity.io'},
          {clientFactory: mock.factory},
        ),
      ),
      firstValueFrom(
        checkFor(
          {projectId: 'p1', dataset: 'd1', apiHost: 'https://api.sanity.work'},
          {clientFactory: mock.factory},
        ),
      ),
    ])

    expect(mock.callCount()).toBe(2)
  })

  it('does not retry a failed request', async () => {
    const mock = createMockFactory({authenticated: true})
    await firstValueFrom(
      checkFor({projectId: 'p-no-retry', dataset: 'd1'}, {clientFactory: mock.factory}),
    )
    expect(mock.configs()[0].maxRetries).toBe(0)
  })

  it('uses cookie auth (withCredentials) when no token is in localStorage', async () => {
    const mock = createMockFactory({authenticated: true})
    const probe$ = checkFor({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory})
    await firstValueFrom(probe$)

    const config = mock.configs()[0]
    expect(config.withCredentials).toBe(true)
    expect(config.token).toBeUndefined()
  })

  it('uses token auth when a token is present in localStorage', async () => {
    localStorage.setItem(getAuthTokenStorageKey('p1'), JSON.stringify({token: 'mock-token-abc'}))

    const mock = createMockFactory({authenticated: true})
    const probe$ = checkFor({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory})
    await firstValueFrom(probe$)

    const config = mock.configs()[0]
    expect(config.token).toBe('mock-token-abc')
    expect(config.withCredentials).toBeUndefined()
  })

  it('does not write to localStorage when probing', async () => {
    const mock = createMockFactory({authenticated: true})
    const check$ = checkFor({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory})
    const writeSpy = vi.spyOn(Storage.prototype, 'setItem')

    await firstValueFrom(check$)

    // The check only reads the store's state, and never writes auth state.
    expect(writeSpy).not.toHaveBeenCalled()
    writeSpy.mockRestore()
  })

  it('asks with the token stored at the time of asking', async () => {
    // A project of its own: probes from earlier tests stay subscribed through their grace window
    // and would share this test's requests.
    const mock = createMockFactory({authenticated: true})
    const probe$ = checkFor(
      {projectId: 'p-token-switch', dataset: 'd1'},
      {clientFactory: mock.factory},
    )
    const subscription = probe$.subscribe()
    await vi.waitFor(() => expect(mock.callCount()).toBe(1))
    expect(mock.configs()[0].withCredentials).toBe(true)

    // Another tab signs in with a token. Its store writes the token and announces it on the
    // token's broadcast channel, which reaches every tab.
    const tokenStorage = createBroadcastStorage<{token?: string}>(
      getAuthTokenStorageKey('p-token-switch'),
      (current) => current,
    )
    tokenStorage.update({token: 'tok'})
    tokenStorage.dispose()

    await vi.waitFor(() => expect(mock.callCount()).toBe(2))
    expect(mock.configs()[1].token).toBe('tok')
    subscription.unsubscribe()
  })

  it('asks again when the token changes in the same tab', async () => {
    const key = getAuthTokenStorageKey('p-same-tab')
    localStorage.setItem(key, JSON.stringify({token: 'old-token'}))
    const mock = createMockFactory({authenticated: true})
    const states = createStoreStates('p-same-tab')
    const subscription = checkFor(
      {projectId: 'p-same-tab', dataset: 'd1'},
      {clientFactory: mock.factory},
      states,
    ).subscribe()
    await vi.waitFor(() => expect(mock.callCount()).toBe(1))
    expect(mock.configs()[0].token).toBe('old-token')

    // The store in this tab writes a new token. A `storage` event fires only in other tabs, so the
    // check must hear it from the store itself.
    states.tokenState.update({token: 'new-token'})

    await vi.waitFor(() => expect(mock.callCount()).toBe(2))
    expect(mock.configs()[1].token).toBe('new-token')
    subscription.unsubscribe()
  })

  it('asks again after a cookie sign-in, even while an earlier check is in flight', async () => {
    const responses: {resolve: (value: unknown) => void; reject: (err: unknown) => void}[] = []
    const mock = createMockFactory({
      authIdImpl: () => new Promise((resolve, reject) => responses.push({resolve, reject})),
    })
    const ids: (string | undefined)[] = []
    const subscription = checkFor(
      {projectId: 'p-race', dataset: 'd1'},
      {clientFactory: mock.factory},
    ).subscribe((id) => ids.push(id))
    await vi.waitFor(() => expect(mock.callCount()).toBe(1))

    // Another workspace of the project signs in with the cookie while the first check is pending.
    const channel = new BroadcastChannel(getCookieAuthStateKey('p-race'))
    channel.postMessage(JSON.stringify({authenticated: true}))
    channel.close()
    await vi.waitFor(() => expect(mock.callCount()).toBe(2))

    // The check from before the sign-in is refused; the one after it is not.
    responses[0].reject(create401Error())
    responses[1].resolve({id: 'signed-in-user'})
    await vi.waitFor(() => expect(ids.at(-1)).toBe('signed-in-user'))
    subscription.unsubscribe()
  })

  it('does not keep a failed check for a later subscriber', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let fail = true
    const mock = createMockFactory({
      authIdImpl: () =>
        fail ? Promise.reject(new Error('boom')) : Promise.resolve({id: 'mock-id', expiry: 0}),
    })
    const probe$ = checkFor({projectId: 'p-failed', dataset: 'd1'}, {clientFactory: mock.factory})

    expect(await firstValueFrom(probe$)).toBeUndefined()
    fail = false
    expect(await firstValueFrom(probe$)).toBe('mock-id')
    expect(mock.callCount()).toBe(2)
    warnSpy.mockRestore()
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

    const probe$ = checkFor({projectId: 'p-cookie', dataset: 'd1'}, {clientFactory: mock.factory})
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
    const probe$ = checkFor({projectId: 'p-token', dataset: 'd1'}, {clientFactory: mock.factory})

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
