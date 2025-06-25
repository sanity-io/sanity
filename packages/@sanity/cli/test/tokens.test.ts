import {describe, expect} from 'vitest'

import {describeCliTest, testConcurrent} from './shared/describe'
import {getTestRunArgs, runSanityCmdCommand, studioVersions} from './shared/environment'

describeCliTest('CLI: `sanity tokens`', () => {
  describe.each(studioVersions)('%s', (version) => {
    const testRunArgs = getTestRunArgs(version)
    const testId = Math.random().toString(36).slice(2, 15)

    testConcurrent('tokens add/list/delete', async () => {
      const tokenLabel = `test-token-${testId}-${Date.now()}`

      // `tokens add`
      let result = await runSanityCmdCommand(version, ['tokens', 'add', tokenLabel])
      expect(result.stdout).toMatch(/token created successfully/i)
      expect(result.stdout).toContain(tokenLabel)
      expect(result.stdout).toMatch(/token:/i)
      expect(result.code).toBe(0)

      // `tokens list` - verify token appears in list
      result = await runSanityCmdCommand(version, ['tokens', 'list'])
      expect(result.stdout).toContain(tokenLabel)
      expect(result.code).toBe(0)

      // `tokens delete` - clean up test token
      result = await runSanityCmdCommand(version, ['tokens', 'delete', tokenLabel, '--yes'])
      expect(result.stdout).toMatch(/token deleted successfully/i)
      expect(result.code).toBe(0)

      // `tokens list` - verify token was deleted
      result = await runSanityCmdCommand(version, ['tokens', 'list'])
      expect(result.stdout).not.toContain(tokenLabel)
      expect(result.code).toBe(0)
    })

    testConcurrent('tokens list --format=json', async () => {
      const tokenLabel = await addToken()
      const result = await runSanityCmdCommand(version, ['tokens', 'list', '--format=json'])
      expect(result.code).toBe(0)

      const tokens = JSON.parse(result.stdout)
      expect(Array.isArray(tokens)).toBe(true)
      expect(tokens.some((token: any) => token.label === tokenLabel)).toBe(true)

      // Clean up test token
      await runSanityCmdCommand(version, ['tokens', 'delete', tokenLabel, '--yes'])
    })

    testConcurrent('tokens add with role', async () => {
      const tokenLabel = `test-token-viewer-${testId}-${Date.now()}`

      const result = await runSanityCmdCommand(version, [
        'tokens',
        'add',
        tokenLabel,
        '--role=editor',
      ])
      expect(result.stdout).toMatch(/token created successfully/i)
      expect(result.stdout).toContain(tokenLabel)
      expect(result.stdout).toMatch(/role.*editor/i)
      expect(result.code).toBe(0)

      // Clean up test token
      await runSanityCmdCommand(version, ['tokens', 'delete', tokenLabel, '--yes'])
    })

    // Helper method for adding a new unique token
    async function addToken(): Promise<string> {
      const tokenLabel = `test-token-${testId}-${Date.now()}`
      const result = await runSanityCmdCommand(version, ['tokens', 'add', tokenLabel, '--yes'])
      expect(result.code).toBe(0)
      expect(result.stdout).toMatch(/token created successfully/i)
      return tokenLabel
    }
  })
})
