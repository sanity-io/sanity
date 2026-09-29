import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

/**
 * The module under test branches on `window.navigator.userAgent` (a jsdom
 * escape hatch that skips the global registry entirely), so every test that
 * exercises registry behavior masks the jsdom user agent first. The module
 * also reads `process.env.SANITY_ISOLATED_CONTEXTS` at evaluation time, so
 * each test re-imports it fresh via `vi.resetModules()`.
 */
function pretendRealBrowser() {
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
    'Mozilla/5.0 (createGlobalScopedContext test)',
  )
}

async function importFresh() {
  return import('../createGlobalScopedContext')
}

describe('createGlobalScopedContext', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.doUnmock('../../core/version')
  })

  it('shares one context across duplicate same-version copies via the global registry', async () => {
    pretendRealBrowser()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const key = 'sanity/_singletons/context/__test-shared' as const
    const first = await importFresh()
    const contextA = first.createGlobalScopedContext(key, null)

    // A second module instance (fresh evaluation) of the same version.
    vi.resetModules()
    const second = await importFresh()
    const contextB = second.createGlobalScopedContext(key, null)

    expect(contextB).toBe(contextA)
  })

  it('throws when a duplicate copy has a different version', async () => {
    pretendRealBrowser()

    const key = 'sanity/_singletons/context/__test-mismatch' as const
    const first = await importFresh()
    first.createGlobalScopedContext(key, null)

    vi.resetModules()
    vi.doMock('../../core/version', () => ({SANITY_VERSION: '0.0.0-other'}))
    const second = await importFresh()

    expect(() => second.createGlobalScopedContext(key, null)).toThrow(
      /Duplicate instances of context .* with incompatible versions/,
    )
  })

  it('keeps contexts module-local when SANITY_ISOLATED_CONTEXTS is "true"', async () => {
    pretendRealBrowser()
    vi.stubEnv('SANITY_ISOLATED_CONTEXTS', 'true')

    const key = 'sanity/_singletons/context/__test-isolated' as const
    const mod = await importFresh()
    const contextA = mod.createGlobalScopedContext(key, null)
    const contextB = mod.createGlobalScopedContext(key, null)

    // Local `createContext` per call, and nothing written to the registry.
    expect(contextA).not.toBe(contextB)
    expect((globalThis as Record<symbol, unknown>)[Symbol.for(key)]).toBeUndefined()
  })

  it('an isolated copy never trips the version guard of an already-registered copy', async () => {
    pretendRealBrowser()

    const key = 'sanity/_singletons/context/__test-isolated-mismatch' as const

    // A host studio of another version registers first.
    vi.doMock('../../core/version', () => ({SANITY_VERSION: '0.0.0-host'}))
    const host = await importFresh()
    host.createGlobalScopedContext(key, null)

    // An embedded, isolated copy of a different version evaluates afterwards.
    vi.resetModules()
    vi.doUnmock('../../core/version')
    vi.stubEnv('SANITY_ISOLATED_CONTEXTS', 'true')
    const embedded = await importFresh()

    expect(() => embedded.createGlobalScopedContext(key, null)).not.toThrow()
  })
})
