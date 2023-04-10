import {describeCliTest} from './shared/describe'
import {getTestRunArgs, runSanityCmdCommand, studioVersions} from './shared/environment'

describeCliTest('CLI: `sanity dataset copy`', () => {
  describe.each(studioVersions)('%s', (version) => {
    // Copy tests can be fairly slow even on small datasets
    jest.setTimeout(120 * 1000)

    const testRunArgs = getTestRunArgs(version)

    test('dataset copy', async () => {
      let result = await runSanityCmdCommand(version, [
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
      result = await runSanityCmdCommand(version, ['dataset', 'copy', '--list'])
      expect(result.code).toBe(0)
      expect(result.stdout).toContain(testRunArgs.datasetCopy)
    })
  })
})
