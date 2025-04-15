import {describe, expect} from 'vitest'

import {describeCliTest, testConcurrent} from './shared/describe'
import {runSanityCmdCommand, studioVersions} from './shared/environment'

describeCliTest('CLI: blueprints commands', () => {
  describe.each(studioVersions)('%s', (version) => {
    // testConcurrent('blueprints help', async () => {
    //   const result = await runSanityCmdCommand(version, ['blueprints'])
    //   expect(result.stdout).toContain('Deploy and manage Sanity Blueprints and Stacks (IaC)')
    //   expect(result.code).toBe(0)
    // })

    // testConcurrent('blueprints init', async () => {
    //   const result = await runSanityCmdCommand(version, ['blueprints', 'init'])
    //   expect(result.stdout).toContain('No API token found')
    //   expect(result.code).toBe(0)
    // })

    testConcurrent('blueprints config', async () => {
      const result = await runSanityCmdCommand(version, ['blueprints', 'config'])
      expect(result.stdout).toContain('No configuration found')
      expect(result.code).toBe(0)
    })

    testConcurrent('blueprints plan', async () => {
      const result = await runSanityCmdCommand(version, ['blueprints', 'plan'])
      expect(result.stdout).toContain('Unable to read Blueprint manifest file')
      expect(result.code).toBe(0)
    })

    testConcurrent('blueprints deploy', async () => {
      const result = await runSanityCmdCommand(version, ['blueprints', 'deploy'])
      expect(result.stdout).toContain('Unable to read Blueprint manifest file')
      expect(result.code).toBe(0)
    })

    testConcurrent('blueprints info', async () => {
      const result = await runSanityCmdCommand(version, ['blueprints', 'info'])
      expect(result.stdout).toContain('Unable to read Blueprint manifest file')
      expect(result.code).toBe(0)
    })

    testConcurrent('blueprints stacks', async () => {
      const result = await runSanityCmdCommand(version, ['blueprints', 'stacks'])
      expect(result.stdout).toContain('Unable to read Blueprint manifest file')
      expect(result.code).toBe(0)
    })

    testConcurrent('blueprints logs', async () => {
      const result = await runSanityCmdCommand(version, ['blueprints', 'logs'])
      expect(result.stdout).toContain('Unable to read Blueprint manifest file')
      expect(result.code).toBe(0)
    })

    testConcurrent('blueprints add function', async () => {
      const result = await runSanityCmdCommand(version, ['blueprints', 'add', 'function'])
      expect(result.stdout).toContain('No blueprint file found')
      expect(result.code).toBe(0)
    })
  })
})
