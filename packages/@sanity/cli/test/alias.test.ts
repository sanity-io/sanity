import {describe, expect, vi} from 'vitest'

import {describeCliTest, testConcurrent} from './shared/describe'
import {getTestRunArgs, runSanityCmdCommand, studioNames} from './shared/environment'

describeCliTest('CLI: `sanity dataset alias`', () => {
  describe.each(studioNames)('%s', (studioName) => {
    vi.setConfig({testTimeout: 30 * 1000})

    const testRunArgs = getTestRunArgs()

    testConcurrent('dataset alias create', async () => {
      let result = await runSanityCmdCommand(studioName, [
        'dataset',
        'alias',
        'create',
        testRunArgs.alias,
        testRunArgs.sourceDataset,
      ])

      expect(result.stdout).toContain(testRunArgs.alias)
      expect(result.stdout).toContain(`linked to ${testRunArgs.sourceDataset}`)
      expect(result.code).toBe(0)

      result = await runSanityCmdCommand(studioName, ['dataset', 'list'])
      expect(result.stdout).toContain(`~${testRunArgs.alias} -> ${testRunArgs.sourceDataset}`)
    })

    testConcurrent('dataset alias unlink', async () => {
      const alias = await createAlias('unlink')
      let result = await runSanityCmdCommand(studioName, [
        'dataset',
        'alias',
        'unlink',
        alias,
        '--force',
      ])
      expect(result.stdout).toContain(`${alias} unlinked from ${testRunArgs.sourceDataset}`)
      expect(result.code).toBe(0)

      result = await runSanityCmdCommand(studioName, ['dataset', 'list'])
      expect(result.code).toBe(0)
      expect(result.stdout).toContain(`~${alias} -> <unlinked>`)
    })

    testConcurrent('dataset alias link', async () => {
      // Create an unlinked alias so we can... link it
      const alias = await unlinkAlias(await createAlias('link'))
      let result = await runSanityCmdCommand(studioName, [
        'dataset',
        'alias',
        'link',
        alias,
        testRunArgs.sourceDataset,
        '--force',
      ])
      expect(result.stdout).toContain(`${alias} linked to ${testRunArgs.sourceDataset}`)
      expect(result.code).toBe(0)

      result = await runSanityCmdCommand(studioName, ['dataset', 'list'])
      expect(result.stdout).toContain(`~${alias} -> ${testRunArgs.sourceDataset}`)
    })

    testConcurrent('dataset alias delete', async () => {
      const alias = await createAlias('del')
      let result = await runSanityCmdCommand(studioName, [
        'dataset',
        'alias',
        'delete',
        alias,
        '--force',
      ])
      expect(result.stdout).toMatch(/alias deleted/i)
      expect(result.code).toBe(0)

      result = await runSanityCmdCommand(studioName, ['dataset', 'list'])
      expect(result.stdout).not.toContain(`~${alias}`)
    })

    // Helpers because we'll need some setup/teardown for each test
    async function createAlias(aliasSuffix: string) {
      const alias = `${testRunArgs.alias}-${aliasSuffix}`
      await runSanityCmdCommand(studioName, [
        'dataset',
        'alias',
        'create',
        alias,
        testRunArgs.sourceDataset,
      ])
      return alias
    }

    async function unlinkAlias(alias: string) {
      await runSanityCmdCommand(studioName, ['dataset', 'alias', 'unlink', alias, '--force'])
      return alias
    }
  })
})
