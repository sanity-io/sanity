import {describeCliTest, testConcurrent} from './shared/describe'
import {getTestRunArgs, runSanityCmdCommand, studioVersions, testClient} from './shared/environment'

describeCliTest('CLI: `sanity cors`', () => {
  describe.each(studioVersions)('%s', (version) => {
    let originPort = 3334
    const testRunArgs = getTestRunArgs(version)

    testConcurrent('cors add/list', async () => {
      // `cors add`
      let result = await runSanityCmdCommand(version, [
        'cors',
        'add',
        testRunArgs.corsOrigin,
        '--no-credentials',
      ])
      expect(result.stdout).toMatch(/added success/i)
      expect(result.code).toBe(0)

      // `cors list`
      result = await runSanityCmdCommand(version, ['cors', 'list'])
      expect(result.stdout).toContain(testRunArgs.corsOrigin)
      expect(result.code).toBe(0)
    })

    testConcurrent('cors list', async () => {
      const origin = await addCorsOrigin()
      const result = await runSanityCmdCommand(version, ['cors', 'list'])
      expect(result.stdout).toContain(origin)
      expect(result.code).toBe(0)
    })

    testConcurrent('cors delete', async () => {
      const origin = await addCorsOrigin()
      let result = await runSanityCmdCommand(version, ['cors', 'delete', origin])
      expect(result.stdout).toMatch(/deleted/i)
      expect(result.code).toBe(0)

      // `cors list`
      result = await runSanityCmdCommand(version, ['cors', 'list'])
      expect(result.stdout).not.toContain(origin)
      expect(result.code).toBe(0)
    })

    // Helper method for adding a new unique CORS origin
    async function addCorsOrigin(): Promise<string> {
      const origin = `${testRunArgs.corsOrigin}:${originPort++}`
      await testClient.request({
        method: 'POST',
        url: '/cors',
        body: {origin, allowCredentials: false},
        maxRedirects: 0,
      })
      return origin
    }
  })
})
