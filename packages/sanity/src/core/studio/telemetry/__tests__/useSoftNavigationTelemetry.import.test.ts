import {afterEach, expect, it, vi} from 'vitest'

vi.mock('../../workspace', () => ({useWorkspace: vi.fn()}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

it('does not sample a page load when imported without a window', async () => {
  vi.stubGlobal('window', undefined)
  const random = vi.spyOn(Math, 'random')

  await import('../useSoftNavigationTelemetry')

  expect(random).not.toHaveBeenCalled()
})
