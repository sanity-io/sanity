import path from 'path'
import {stat} from 'fs/promises'
import {describeCliTest, testConcurrent} from './shared/describe'
import {
  getTestRunArgs,
  runSanityCmdCommand,
  studiosPath,
  studioVersions,
} from './shared/environment'

describeCliTest('CLI: `sanity dataset export` / `import`', () => {
  describe.each(studioVersions)('%s', (version) => {
    const testRunArgs = getTestRunArgs(version)

    testConcurrent('export', async () => {
      const result = await runSanityCmdCommand(version, [
        'dataset',
        'export',
        'production',
        testRunArgs.exportTarball,
        '--overwrite',
      ])
      expect(result.stdout).toMatch(/export finished/i)
      expect(result.code).toBe(0)

      const stats = await stat(path.join(studiosPath, version, testRunArgs.exportTarball))
      expect(stats.isFile()).toBe(true)
      expect(stats.size).toBeGreaterThanOrEqual(5000)
    })

    testConcurrent('import', async () => {
      const result = await runSanityCmdCommand(version, [
        'dataset',
        'import',
        testRunArgs.importTarballPath,
        testRunArgs.sourceDataset,
        '--missing',
      ])
      expect(result.stdout).toMatch(/done!/i)
      expect(result.code).toBe(0)
    })
  })
})
