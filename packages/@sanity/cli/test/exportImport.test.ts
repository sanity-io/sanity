import path from 'path'
import {stat} from 'fs/promises'
import tar from 'tar'
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

      const tarballPath = path.join(studiosPath, version, testRunArgs.exportTarball)

      const stats = await stat(tarballPath)
      expect(stats.isFile()).toBe(true)

      // We're just checking for the existence of a few files here - the actual export
      // functionality is fully tested in `@sanity/export`
      const filesTypes: string[] = []
      await tar.t({
        file: tarballPath,
        onentry: (entry) => filesTypes.push(path.extname(entry.path)),
      })

      expect(filesTypes).toContain('.ndjson')
      expect(filesTypes).toContain('.jpg')
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
