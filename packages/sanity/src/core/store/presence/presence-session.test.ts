import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const {nanoid} = vi.hoisted(() => ({nanoid: vi.fn(() => 'abcdefghijklmnop')}))

vi.mock('nanoid', () => ({nanoid}))

describe('presence session initialization', () => {
  beforeEach(() => {
    vi.resetModules()
    nanoid.mockClear()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('does not request randomness when imported without a window', async () => {
    vi.stubGlobal('window', undefined)
    const {SESSION_ID} = await import('./presence-store')

    expect(SESSION_ID).toBe('')
    expect(nanoid).not.toHaveBeenCalled()
  })

  it('generates and persists a session ID across module reloads', async () => {
    const {SESSION_ID} = await import('./presence-store')

    expect(SESSION_ID).toBe('abcdefghijklmnop')
    expect(nanoid).toHaveBeenCalledWith(16)
    expect(window.sessionStorage.getItem('presence_session_id')).toBe(SESSION_ID)

    vi.resetModules()
    expect((await import('./presence-store')).SESSION_ID).toBe(SESSION_ID)
    expect(nanoid).toHaveBeenCalledTimes(1)
  })

  it('reuses a stored session without requesting randomness', async () => {
    window.sessionStorage.setItem('presence_session_id', 'stored-session')

    expect((await import('./presence-store')).SESSION_ID).toBe('stored-session')
    expect(nanoid).not.toHaveBeenCalled()
  })

  it('tolerates inaccessible session storage in the browser', async () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('Access denied')
    })

    expect((await import('./presence-store')).SESSION_ID).toBe('abcdefghijklmnop')
  })
})
