import {describe, expect, it, vi} from 'vitest'

import {
  loadDetectViteDevServerStopped,
  loadDevServerStoppedErrorScreen,
} from './ViteDevServerStopped.loaders'

const moduleLoads = vi.hoisted(() => ({
  detect: vi.fn(),
  errorScreen: vi.fn(),
}))

vi.mock('./DetectViteDevServerStopped.lazy', () => {
  moduleLoads.detect()
  return {default: vi.fn()}
})

vi.mock('./DevServerStoppedErrorScreen.lazy', () => {
  moduleLoads.errorScreen()
  return {default: vi.fn()}
})

describe('ViteDevServerStopped loaders', () => {
  it('preloads and caches the error screen with the detector', async () => {
    await loadDetectViteDevServerStopped()

    expect(moduleLoads.detect).toHaveBeenCalledTimes(1)
    expect(moduleLoads.errorScreen).toHaveBeenCalledTimes(1)

    await loadDevServerStoppedErrorScreen()

    expect(moduleLoads.detect).toHaveBeenCalledTimes(1)
    expect(moduleLoads.errorScreen).toHaveBeenCalledTimes(1)
  })
})
