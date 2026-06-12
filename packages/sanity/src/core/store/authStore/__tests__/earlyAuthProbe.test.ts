import {type CurrentUser} from '@sanity/types'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  _clearEarlyAuthGlobal,
  consumeEarlyAuthProbe,
  EARLY_PROBE_MISS,
  type EarlyAuthProbeEntry,
} from '../earlyAuthProbe'

const MOCK_USER: CurrentUser = {
  id: 'user-abc',
  name: 'Test User',
  email: 'test@example.com',
  profileImage: '',
  provider: 'google',
  role: '',
  roles: [{name: 'administrator', title: 'Administrator'}],
}

const BASE_OPTS = {
  projectId: 'myproject',
  apiHost: 'https://api.sanity.io',
  credential: 'cookie' as const,
  token: null,
}

function seedProbe(overrides?: Partial<EarlyAuthProbeEntry>): void {
  const entry: EarlyAuthProbeEntry = {
    projectId: 'myproject',
    apiHost: 'api.sanity.io',
    credential: 'cookie',
    token: null,
    startedAt: Date.now(),
    promise: Promise.resolve({type: 'ok', user: MOCK_USER}),
    ...overrides,
  }
  // @ts-expect-error - window.__sanityEarlyAuth not declared
  window.__sanityEarlyAuth = entry
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  // Only clear global if window is available (after unstubAllGlobals it should be)
  if (typeof window !== 'undefined') {
    _clearEarlyAuthGlobal()
  }
})

describe('consumeEarlyAuthProbe guard matrix', () => {
  it('case 1: window undefined -> EARLY_PROBE_MISS (SSR guard)', () => {
    vi.stubGlobal('window', undefined)
    const result = consumeEarlyAuthProbe(BASE_OPTS)
    expect(result).toBe(EARLY_PROBE_MISS)
  })

  it('case 2: global absent -> EARLY_PROBE_MISS (synchronous)', () => {
    const result = consumeEarlyAuthProbe(BASE_OPTS)
    expect(result).toBe(EARLY_PROBE_MISS)
  })

  it('case 3: full match + probe resolves ok -> resolves to user', async () => {
    seedProbe({promise: Promise.resolve({type: 'ok', user: MOCK_USER})})
    const result = consumeEarlyAuthProbe(BASE_OPTS)
    expect(result).not.toBe(EARLY_PROBE_MISS)
    const user = await (result as Promise<unknown>)
    expect(user).toBe(MOCK_USER)
  })

  it('case 4: projectId mismatch -> EARLY_PROBE_MISS (synchronous)', () => {
    seedProbe({projectId: 'other-project'})
    const result = consumeEarlyAuthProbe(BASE_OPTS)
    expect(result).toBe(EARLY_PROBE_MISS)
  })

  it('case 5: apiHost mismatch -> EARLY_PROBE_MISS (synchronous)', () => {
    seedProbe({apiHost: 'api.other.io'})
    const result = consumeEarlyAuthProbe(BASE_OPTS)
    expect(result).toBe(EARLY_PROBE_MISS)
  })

  it('case 6: apiHost stored bare vs opts URL -> MATCH (normalization)', async () => {
    // probe stores 'api.sanity.io'; opts provides 'https://api.sanity.io' -> should match
    seedProbe({apiHost: 'api.sanity.io'})
    const result = consumeEarlyAuthProbe({...BASE_OPTS, apiHost: 'https://api.sanity.io'})
    expect(result).not.toBe(EARLY_PROBE_MISS)
    const user = await (result as Promise<unknown>)
    expect(user).toBe(MOCK_USER)
  })

  it('case 7: credential mismatch (probe token, opts cookie) -> EARLY_PROBE_MISS', () => {
    seedProbe({credential: 'token', token: 'tok-x'})
    const result = consumeEarlyAuthProbe({...BASE_OPTS, credential: 'cookie', token: null})
    expect(result).toBe(EARLY_PROBE_MISS)
  })

  it('case 8: token mismatch (tok-a vs tok-b) -> EARLY_PROBE_MISS', () => {
    seedProbe({credential: 'token', token: 'tok-a'})
    const result = consumeEarlyAuthProbe({...BASE_OPTS, credential: 'token', token: 'tok-b'})
    expect(result).toBe(EARLY_PROBE_MISS)
  })

  it('case 9: startedAt 6 minutes ago -> EARLY_PROBE_MISS (age cap)', () => {
    const sixMinutesAgo = Date.now() - 6 * 60 * 1000
    seedProbe({startedAt: sixMinutesAgo})
    const result = consumeEarlyAuthProbe(BASE_OPTS)
    expect(result).toBe(EARLY_PROBE_MISS)
  })

  it('case 10: startedAt 4 minutes ago -> proceeds (within 5-minute window)', async () => {
    const fourMinutesAgo = Date.now() - 4 * 60 * 1000
    seedProbe({startedAt: fourMinutesAgo, promise: Promise.resolve({type: 'ok', user: MOCK_USER})})
    const result = consumeEarlyAuthProbe(BASE_OPTS)
    expect(result).not.toBe(EARLY_PROBE_MISS)
    const user = await (result as Promise<unknown>)
    expect(user).toBe(MOCK_USER)
  })

  it('case 11: probe resolves unauthenticated -> resolves to null', async () => {
    seedProbe({promise: Promise.resolve({type: 'unauthenticated'})})
    const result = consumeEarlyAuthProbe(BASE_OPTS)
    expect(result).not.toBe(EARLY_PROBE_MISS)
    const value = await (result as Promise<unknown>)
    expect(value).toBeNull()
  })

  it('case 12: probe resolves error -> resolves to EARLY_PROBE_MISS (preserves CorsOriginError path)', async () => {
    seedProbe({promise: Promise.resolve({type: 'error', status: 500})})
    const result = consumeEarlyAuthProbe(BASE_OPTS)
    expect(result).not.toBe(EARLY_PROBE_MISS)
    const value = await (result as Promise<unknown>)
    expect(value).toBe(EARLY_PROBE_MISS)
  })

  it('case 13: probe.promise rejects -> resolves to EARLY_PROBE_MISS (NEVER rejects)', async () => {
    // Create the rejection before seeding so we can attach a handler immediately
    // to prevent "unhandled rejection" from bubbling up in the test runner.
    const rejection = new Promise<never>((_, reject) => reject(new Error('network failure')))
    // Attach a no-op catch here so the promise itself is always handled,
    // regardless of when consumeEarlyAuthProbe attaches its own .catch.
    rejection.catch(() => {})

    seedProbe({promise: rejection})
    const result = consumeEarlyAuthProbe(BASE_OPTS)
    expect(result).not.toBe(EARLY_PROBE_MISS)

    // Must not throw/reject
    const value = await (result as Promise<unknown>)
    expect(value).toBe(EARLY_PROBE_MISS)
  })

  it('case 14: consume-once: second call with identical opts -> EARLY_PROBE_MISS (global deleted on first)', () => {
    seedProbe()

    // First call consumes the global
    const first = consumeEarlyAuthProbe(BASE_OPTS)
    expect(first).not.toBe(EARLY_PROBE_MISS)

    // Second call with same opts -> miss (global already deleted)
    const second = consumeEarlyAuthProbe(BASE_OPTS)
    expect(second).toBe(EARLY_PROBE_MISS)
  })

  it('case 15: StrictMode analogue: two calls with identical opts -> second is EARLY_PROBE_MISS', () => {
    seedProbe()

    void consumeEarlyAuthProbe(BASE_OPTS)
    const secondResult = consumeEarlyAuthProbe(BASE_OPTS)
    expect(secondResult).toBe(EARLY_PROBE_MISS)
  })
})
