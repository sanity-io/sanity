import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const {nanoid} = vi.hoisted(() => ({nanoid: vi.fn(() => 'abcdefghijklmnop')}))

vi.mock('nanoid', () => ({nanoid}))

describe('presence session id', () => {
  beforeEach(() => {
    vi.resetModules()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not generate an id when the module is imported', async () => {
    await import('./presence-store')

    expect(nanoid).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem('presence_session_id')).toBeNull()
  })

  it('creates the id on first use, persists it and keeps returning it', async () => {
    const {getSessionId} = await import('./presence-store')

    expect(getSessionId()).toBe('abcdefghijklmnop')
    expect(getSessionId()).toBe('abcdefghijklmnop')
    expect(nanoid).toHaveBeenCalledTimes(1)
    expect(nanoid).toHaveBeenCalledWith(16)
    expect(window.sessionStorage.getItem('presence_session_id')).toBe('abcdefghijklmnop')
  })

  it('reuses the id stored in session storage across page loads', async () => {
    window.sessionStorage.setItem('presence_session_id', 'stored-session')
    const {getSessionId} = await import('./presence-store')

    expect(getSessionId()).toBe('stored-session')
    expect(nanoid).not.toHaveBeenCalled()
  })

  it('keeps a stable id when session storage is inaccessible', async () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('Access denied')
    })
    const {getSessionId} = await import('./presence-store')

    expect(getSessionId()).toBe('abcdefghijklmnop')
    expect(getSessionId()).toBe('abcdefghijklmnop')
    expect(nanoid).toHaveBeenCalledTimes(1)
  })

  it('throws instead of returning an empty id when no id can be generated', async () => {
    nanoid.mockImplementationOnce(() => {
      throw new Error('Disallowed operation called within global scope')
    })
    const {getSessionId} = await import('./presence-store')

    expect(() => getSessionId()).toThrow('Disallowed operation')
  })
})
