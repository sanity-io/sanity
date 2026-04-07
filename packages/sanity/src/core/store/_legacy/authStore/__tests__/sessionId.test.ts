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
    expect(getSessionId()).toBeNull()
  })

  it('returns null when hash has no valid session ID', async () => {
    window.location.hash = '#other=value'

    const {getHashSessionId: getSessionId} = await import('../sessionId')
    expect(getSessionId()).toBeNull()
  })

  it('rejects session IDs shorter than 20 characters', async () => {
    window.location.hash = '#sid=short'

    const {getHashSessionId: getSessionId} = await import('../sessionId')
    expect(getSessionId()).toBeNull()
  })

  it('preserves other hash params when consuming the session ID', async () => {
    window.location.hash = '#sid=12345678901234567890&other=value'

    const {getHashSessionId: getSessionId} = await import('../sessionId')
    expect(getSessionId()).toBe('12345678901234567890')
    expect(replaceStateSpy).toHaveBeenCalled()
  })
})
