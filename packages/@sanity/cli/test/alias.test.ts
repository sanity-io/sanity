import {describe, expect, vi} from 'vitest'

import {describeCliTest, testConcurrent} from './shared/describe'
import {getTestRunArgs, runSanityCmdCommand, studioNames} from './shared/environment'

describeCliTest('CLI: `sanity dataset alias`', () => {
  describe.each(studioNames)('%s', (studioName) => {
    vi.setConfig({testTimeout: 30 * 1000})

    const testRunArgs = getTestRunArgs()

    testConcurrent('dataset alias create', async () => {
      await cleanupAlias(testRunArgs.alias)

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
      await cleanupAlias(getAliasName('unlink'))

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
      await cleanupAlias(getAliasName('link'))

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
      await cleanupAlias(getAliasName('del'))

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
    function getAliasName(aliasSuffix: string) {
      return `${testRunArgs.alias}-${aliasSuffix}`
    }

    async function createAlias(aliasSuffix: string) {
      const alias = getAliasName(aliasSuffix)
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

    /**
     * Delete an alias if it exists. It does not throw an error if the alias does not exist.
     */
    async function cleanupAlias(alias: string) {
      const isExpectedError = (message: string) =>
        message.includes('does not exist') || message.includes('alias not found')

      try {
        await runSanityCmdCommand(studioName, ['dataset', 'alias', 'delete', alias, '--force'])
      } catch (e) {
        if (isExpectedError(e.message)) {
          return
        }
        throw e
      }
    }
  })
})
