import {afterEach, describe, expect, it, vi} from 'vitest'

/**
 * `pageVisibility` latches its state in a module-level variable that is
 * initialised at import time, so each test imports the module fresh (after
 * `vi.resetModules()`) with the desired `document.visibilityState` already in
 * place.
 */
async function importFresh() {
  const module = await import('../pageVisibility')
  return module.getPageVisibilitySnapshot
}

describe('getPageVisibilitySnapshot', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('reports a clean foreground load when the page was never hidden', async () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')

    const getPageVisibilitySnapshot = await importFresh()
    const snapshot = getPageVisibilitySnapshot(1000)

    expect(snapshot.wasHidden).toBe(false)
    expect(snapshot.firstHiddenTime).toBeNull()
    expect(snapshot.visibilityState).toBe('visible')
  })

  it('flags a load that was already hidden at module init (background tab)', async () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')

    const getPageVisibilitySnapshot = await importFresh()
    const snapshot = getPageVisibilitySnapshot(1000)

    expect(snapshot.wasHidden).toBe(true)
    expect(snapshot.firstHiddenTime).toBe(0)
    expect(snapshot.visibilityState).toBe('hidden')
  })

  it('captures a hide that happens after load, relative to the measured moment', async () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    vi.spyOn(performance, 'now').mockReturnValue(500)

    const getPageVisibilitySnapshot = await importFresh()
    expect(getPageVisibilitySnapshot(1000).wasHidden).toBe(false)

    // The page becomes hidden at t=500
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))

    // A measurement taken at t=1000 was preceded by the hide at t=500
    expect(getPageVisibilitySnapshot(1000).wasHidden).toBe(true)
    expect(getPageVisibilitySnapshot(1000).firstHiddenTime).toBe(500)

    // A measurement taken at t=400 happened before the page was hidden
    expect(getPageVisibilitySnapshot(400).wasHidden).toBe(false)
  })

  it('latches the first hide and ignores subsequent visibility changes', async () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    vi.spyOn(performance, 'now').mockReturnValue(300)

    const getPageVisibilitySnapshot = await importFresh()

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))

    // Becomes visible again, then hidden again at a later time
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    vi.spyOn(performance, 'now').mockReturnValue(900)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))

    expect(getPageVisibilitySnapshot(1000).firstHiddenTime).toBe(300)
  })
})
