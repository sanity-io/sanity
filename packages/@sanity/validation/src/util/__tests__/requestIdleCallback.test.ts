import {afterEach, describe, expect, it, vi} from 'vitest'

describe('requestIdleCallback polyfill', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('can cancel a shimmed idle callback after window becomes unavailable', async () => {
    vi.resetModules()

    const {cancelIdleCallback, requestIdleCallback} = await import('../requestIdleCallback')
    const handle = requestIdleCallback(() => undefined)

    vi.stubGlobal('window', undefined)

    expect(() => cancelIdleCallback(handle)).not.toThrow()
  })
})
