import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {firstValueFrom} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {_probeWorkspaceAuthForTest, _resetProbeWorkspaceAuthCache} from '../probeWorkspaceAuth'

// Match the convention from createAuthStore.test.ts: ensure localStorage is
// considered supported in the test environment so the token-attribution code
// path is exercised.
vi.mock('../../../util/supportsLocalStorage', () => ({
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
      request: vi.fn(({uri}: {uri: string}) => {
        if (uri === '/auth/id') {
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

describe('probeWorkspaceAuth', () => {
  beforeEach(() => {
    _resetProbeWorkspaceAuthCache()
    if (typeof localStorage !== 'undefined') localStorage.clear()
  })

  afterEach(() => {
    _resetProbeWorkspaceAuthCache()
  })

  it('emits {authenticated: true} on a 200 response', async () => {
    const mock = createMockFactory({authenticated: true})
    const result = await firstValueFrom(
      _probeWorkspaceAuthForTest({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
    )
    expect(result).toEqual({authenticated: true})
  })

  it('emits {authenticated: false} on a 401 response', async () => {
    const mock = createMockFactory({authenticated: false})
    const result = await firstValueFrom(
      _probeWorkspaceAuthForTest({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
    )
    expect(result).toEqual({authenticated: false})
  })

  it('treats non-401 errors as unauthenticated (fails open)', async () => {
    // A transient failure (network blip, 5xx, CORS misconfig) should not
    // tear down the studio via React's error boundary. The probe degrades
    // to `{authenticated: false}` and logs a warning.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mock = createMockFactory({
      authIdImpl: () => Promise.reject(new Error('boom')),
    })

    const result = await firstValueFrom(
      _probeWorkspaceAuthForTest({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
    )

    expect(result).toEqual({authenticated: false})
    expect(warnSpy).toHaveBeenCalledOnce()
    warnSpy.mockRestore()
  })

  it('dedups probes for the same project/apiHost/token tuple', async () => {
    const mock = createMockFactory({authenticated: true})
    const a = _probeWorkspaceAuthForTest(
      {projectId: 'p1', dataset: 'd1'},
      {clientFactory: mock.factory},
    )
    const b = _probeWorkspaceAuthForTest(
      {projectId: 'p1', dataset: 'd2'}, // different dataset, same project
      {clientFactory: mock.factory},
    )
    expect(a).toBe(b)

    await firstValueFrom(a)
    expect(mock.callCount()).toBe(1)
  })

  it('does not dedup probes for different projects', async () => {
    const mock = createMockFactory({authenticated: true})
    const a = _probeWorkspaceAuthForTest(
      {projectId: 'p1', dataset: 'd1'},
      {clientFactory: mock.factory},
    )
    const b = _probeWorkspaceAuthForTest(
      {projectId: 'p2', dataset: 'd1'},
      {clientFactory: mock.factory},
    )
    expect(a).not.toBe(b)

    await Promise.all([firstValueFrom(a), firstValueFrom(b)])
    expect(mock.callCount()).toBe(2)
  })

  it('does not dedup probes for different apiHosts', async () => {
    const mock = createMockFactory({authenticated: true})
    const a = _probeWorkspaceAuthForTest(
      {projectId: 'p1', dataset: 'd1', apiHost: 'https://api.sanity.io'},
      {clientFactory: mock.factory},
    )
    const b = _probeWorkspaceAuthForTest(
      {projectId: 'p1', dataset: 'd1', apiHost: 'https://api.sanity.work'},
      {clientFactory: mock.factory},
    )
    expect(a).not.toBe(b)
  })

  it('uses cookie auth (withCredentials) when no token is in localStorage', async () => {
    const mock = createMockFactory({authenticated: true})
    const probe$ = _probeWorkspaceAuthForTest(
      {projectId: 'p1', dataset: 'd1'},
      {clientFactory: mock.factory},
    )
    await firstValueFrom(probe$)

    const config = mock.configs()[0]
    expect(config.withCredentials).toBe(true)
    expect(config.token).toBeUndefined()
  })

  it('uses token auth when a token is present in localStorage', async () => {
    localStorage.setItem('__studio_auth_token_p1', JSON.stringify({token: 'mock-token-abc'}))

    const mock = createMockFactory({authenticated: true})
    const probe$ = _probeWorkspaceAuthForTest(
      {projectId: 'p1', dataset: 'd1'},
      {clientFactory: mock.factory},
    )
    await firstValueFrom(probe$)

    const config = mock.configs()[0]
    expect(config.token).toBe('mock-token-abc')
    expect(config.withCredentials).toBeUndefined()
  })

  it('does not write to localStorage when probing', async () => {
    const writeSpy = vi.spyOn(Storage.prototype, 'setItem')
    const mock = createMockFactory({authenticated: true})

    await firstValueFrom(
      _probeWorkspaceAuthForTest({projectId: 'p1', dataset: 'd1'}, {clientFactory: mock.factory}),
    )

    // The probe is independent of the full AuthStore: it only reads
    // localStorage to detect a token, and never writes auth state.
    expect(writeSpy).not.toHaveBeenCalled()
    writeSpy.mockRestore()
  })

  it('keys differently per token so concurrent token + cookie probes for the same project resolve independently', async () => {
    // Project A: no token (cookie probe).
    // Project A again: token in localStorage (token probe).
    // These should be two different cache entries.
    const mock = createMockFactory({authenticated: true})

    const cookieProbe$ = _probeWorkspaceAuthForTest(
      {projectId: 'p1', dataset: 'd1'},
      {clientFactory: mock.factory},
    )
    await firstValueFrom(cookieProbe$)

    localStorage.setItem('__studio_auth_token_p1', JSON.stringify({token: 'tok'}))

    const tokenProbe$ = _probeWorkspaceAuthForTest(
      {projectId: 'p1', dataset: 'd1'},
      {clientFactory: mock.factory},
    )

    expect(cookieProbe$).not.toBe(tokenProbe$)
  })
})
