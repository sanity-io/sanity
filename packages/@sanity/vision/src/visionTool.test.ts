import {afterEach, expect, test, vi} from 'vitest'

import {visionTool} from './visionTool'

vi.mock('sanity', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  definePlugin: (factory: (options: unknown) => unknown) => factory,
}))

afterEach(() => {
  vi.restoreAllMocks()
})

test('warns once that beta.redesign has no effect, and only when the config sets it', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

  visionTool()
  visionTool({defaultApiVersion: 'v2025-02-19'})
  expect(warn).not.toHaveBeenCalled()

  // oxlint-disable-next-line no-deprecated -- the option has no effect, which is what this checks
  visionTool({beta: {redesign: {enabled: true}}})
  // oxlint-disable-next-line no-deprecated -- the option has no effect, which is what this checks
  visionTool({beta: {redesign: {enabled: false}}})
  expect(warn).toHaveBeenCalledOnce()
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('`beta.redesign` has no effect'))
})
