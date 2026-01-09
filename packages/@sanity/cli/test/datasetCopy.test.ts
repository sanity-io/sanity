import {describe, expect, test, vi} from 'vitest'

import {describeCliTest} from './shared/describe'
import {getTestRunArgs, runSanityCmdCommand, studioNames} from './shared/environment'

describeCliTest('CLI: `sanity dataset copy`', () => {
  describe.each(studioNames)('%s', (studioName) => {
    // Copy tests can be fairly slow even on small datasets
    vi.setConfig({testTimeout: 120 * 1000})

    const testRunArgs = getTestRunArgs()

    test('dataset copy', async () => {
      let result = await runSanityCmdCommand(studioName, [
        'dataset',
        'copy',
        'production',
        testRunArgs.datasetCopy,
        '--skip-history',
        '--detach',
      ])
      expect(result.stdout).toMatch(/job .*? started/i)
      expect(result.code).toBe(0)

      // `sanity dataset copy --list`
      result = await runSanityCmdCommand(studioName, ['dataset', 'copy', '--list'])
      expect(result.code).toBe(0)
      expect(result.stdout).toContain(testRunArgs.datasetCopy)
    })
  })
})
