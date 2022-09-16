import {describeCliTest, testConcurrent} from './shared/describe'
import {testClient, getTestRunArgs, runSanityCmdCommand, studioVersions} from './shared/environment'

describeCliTest('CLI: `sanity dataset`', () => {
  describe.each(studioVersions)('%s', (version) => {
    const testRunArgs = getTestRunArgs(version)

    testConcurrent('dataset create', async () => {
      const result = await runSanityCmdCommand(version, [
        'dataset',
        'create',
        testRunArgs.dataset,
        '--visibility',
        'public',
      ])

      expect(result.stdout).toMatch(/dataset created/i)
      expect(result.code).toBe(0)

      const datasets = await testClient.datasets.list()
      const created = datasets.find((dataset) => dataset.name === testRunArgs.dataset)
      expect(created).toBeDefined()
    })

    testConcurrent('dataset list', async () => {
      const result = await runSanityCmdCommand(version, ['dataset', 'list'])

      expect(result.stdout.split('\n')).toContain('production')
      expect(result.code).toBe(0)
    })

    testConcurrent('dataset visibility', async () => {
      // get
      let result = await runSanityCmdCommand(version, [
        'dataset',
        'visibility',
        'get',
        testRunArgs.aclDataset,
      ])
      expect(result.stdout.trim()).toBe('public')
      expect(result.code).toBe(0)

      // set
      result = await runSanityCmdCommand(version, [
        'dataset',
        'visibility',
        'set',
        testRunArgs.aclDataset,
        'private',
      ])
      expect(result.stdout).toMatch(/visibility changed/i)
      expect(result.code).toBe(0)

      // get
      result = await runSanityCmdCommand(version, [
        'dataset',
        'visibility',
        'get',
        testRunArgs.aclDataset,
      ])
      expect(result.stdout.trim()).toBe('private')
      expect(result.code).toBe(0)
    })
  })
})
