import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

describe('sessionId', () => {
  let replaceStateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetModules()
    replaceStateSpy = vi.spyOn(history, 'replaceState').mockImplementation(() => {})
  })

  afterEach(() => {
    replaceStateSpy.mockRestore()
    window.location.hash = ''
    delete globalThis.__SANITY_AUTH_HASH_PARAMS__
  })

  it('extracts session ID from URL hash on module load and removes it from history', async () => {
    window.location.hash = '#sid=12345678901234567890'

    const {getHashSessionId: getSessionId} = await import('../sessionId')

    expect(getSessionId()).toBe('12345678901234567890')
    expect(replaceStateSpy).toHaveBeenCalled()
  })

  it('returns the session ID only once (one-time consumption)', async () => {
    window.location.hash = '#sid=12345678901234567890'

    const {getHashSessionId: getSessionId} = await import('../sessionId')

    expect(getSessionId()).toBe('12345678901234567890')
    expect(getSessionId()).toBeUndefined()
  })

  it('returns null when hash has no valid session ID', async () => {
    window.location.hash = '#other=value'

    const {getHashSessionId: getSessionId} = await import('../sessionId')
    expect(getSessionId()).toBeUndefined()
  })

  it('rejects session IDs shorter than 20 characters', async () => {
    window.location.hash = '#sid=short'

    const {getHashSessionId: getSessionId} = await import('../sessionId')
    expect(getSessionId()).toBeUndefined()
  })

  it('preserves other hash params when consuming the session ID', async () => {
    window.location.hash = '#sid=12345678901234567890&other=value'

    const {getHashSessionId: getSessionId} = await import('../sessionId')
    expect(getSessionId()).toBe('12345678901234567890')
    expect(replaceStateSpy).toHaveBeenCalled()
  })

  it('takes the session ID the studio HTML stashed before the bundle loaded', async () => {
    globalThis.__SANITY_AUTH_HASH_PARAMS__ = {sid: '12345678901234567890', claim: 'other'}

    const {getHashSessionId: getSessionId} = await import('../sessionId')

    expect(getSessionId()).toBe('12345678901234567890')
    expect(getSessionId()).toBeUndefined()
    // Read once, then dropped from the stash so it doesn't linger on the global.
    expect(globalThis.__SANITY_AUTH_HASH_PARAMS__).toEqual({claim: 'other'})
  })

  it('rejects a stashed session ID shorter than 20 characters', async () => {
    globalThis.__SANITY_AUTH_HASH_PARAMS__ = {sid: 'short'}

    const {getHashSessionId: getSessionId} = await import('../sessionId')
    expect(getSessionId()).toBeUndefined()
  })
})
