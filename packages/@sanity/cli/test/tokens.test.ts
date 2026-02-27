import {describe, expect} from 'vitest'

import {testConcurrent} from './shared/describe'
import {getTestRunArgs, runSanityCmdCommand, studioNames} from './shared/environment'

describe.skip('CLI: `sanity tokens`', () => {
  describe.each(studioNames)('%s', (studioName) => {
    const testRunArgs = getTestRunArgs(studioName)
    const testId = Math.random().toString(36).slice(2, 15)

    testConcurrent('tokens add/list/delete', async () => {
      const tokenLabel = `test-token-${testId}-${Date.now()}`

      // `tokens add` with JSON output
      let result = await runSanityCmdCommand(studioName, ['tokens', 'add', tokenLabel, '--json'])
      expect(result.code).toBe(0)

      const token = JSON.parse(result.stdout)
      expect(token.label).toBe(tokenLabel)
      expect(token.id).toBeTruthy()
      expect(token.key).toBeTruthy()

      // `tokens list` - verify token appears in list
      result = await runSanityCmdCommand(studioName, ['tokens', 'list'])
      expect(result.stdout).toContain(tokenLabel)
      expect(result.code).toBe(0)

      // `tokens delete` - clean up test token using ID
      result = await runSanityCmdCommand(studioName, ['tokens', 'delete', token.id, '--yes'])
      expect(result.stdout).toMatch(/token deleted successfully/i)
      expect(result.code).toBe(0)

      // `tokens list` - verify token was deleted
      result = await runSanityCmdCommand(studioName, ['tokens', 'list'])
      expect(result.stdout).not.toContain(tokenLabel)
      expect(result.code).toBe(0)
    })

    testConcurrent('tokens list --json', async () => {
      const {tokenLabel, tokenId} = await addToken()
      const result = await runSanityCmdCommand(studioName, ['tokens', 'list', '--json'])
      expect(result.code).toBe(0)

      const tokens = JSON.parse(result.stdout)
      expect(Array.isArray(tokens)).toBe(true)
      expect(tokens.some((token: any) => token.label === tokenLabel)).toBe(true)

      // Clean up test token using ID
      await runSanityCmdCommand(studioName, ['tokens', 'delete', tokenId, '--yes'])
    })

    testConcurrent('tokens add with role', async () => {
      const tokenLabel = `test-token-editor-${testId}-${Date.now()}`

      const result = await runSanityCmdCommand(studioName, [
        'tokens',
        'add',
        tokenLabel,
        '--role=editor',
        '--json',
      ])
      expect(result.code).toBe(0)

      const token = JSON.parse(result.stdout)
      expect(token.label).toBe(tokenLabel)
      expect(token.roles.some((role: any) => role.title === 'Editor')).toBe(true)

      // Clean up test token using ID
      await runSanityCmdCommand(studioName, ['tokens', 'delete', token.id, '--yes'])
    })

    // Helper method for adding a new unique token
    async function addToken(): Promise<{tokenLabel: string; tokenId: string}> {
      const tokenLabel = `test-token-${testId}-${Date.now()}`
      const result = await runSanityCmdCommand(studioName, [
        'tokens',
        'add',
        tokenLabel,
        '--yes',
        '--json',
      ])
      expect(result.code).toBe(0)

      const token = JSON.parse(result.stdout)
      expect(token.label).toBe(tokenLabel)
      expect(token.id).toBeTruthy()

      return {tokenLabel, tokenId: token.id}
    }
  })
})
