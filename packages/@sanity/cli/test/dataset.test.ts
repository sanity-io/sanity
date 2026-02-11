import {describe, expect} from 'vitest'

import {describeCliTest, testConcurrent} from './shared/describe'
import {getTestRunArgs, runSanityCmdCommand, studioNames, testClient} from './shared/environment'

describeCliTest('CLI: `sanity dataset`', () => {
  describe.each(studioNames)('%s', (studioName) => {
    const testRunArgs = getTestRunArgs()

    testConcurrent('dataset create', async () => {
      const result = await runSanityCmdCommand(studioName, [
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
      const result = await runSanityCmdCommand(studioName, ['dataset', 'list'])

      expect(result.stdout.split('\n')).toContain('production')
      expect(result.code).toBe(0)
    })

    testConcurrent('dataset visibility', async () => {
      // get
      let result = await runSanityCmdCommand(studioName, [
        'dataset',
        'visibility',
        'get',
        testRunArgs.aclDataset,
      ])
      expect(result.stdout.trim()).toBe('public')
      expect(result.code).toBe(0)

      // set
      result = await runSanityCmdCommand(studioName, [
        'dataset',
        'visibility',
        'set',
        testRunArgs.aclDataset,
        'private',
      ])
      expect(result.stdout).toMatch(/visibility changed/i)
      expect(result.code).toBe(0)

      // get
      result = await runSanityCmdCommand(studioName, [
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
