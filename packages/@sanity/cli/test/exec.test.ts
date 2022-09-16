import {describeCliTest, testConcurrent} from './shared/describe'
import {cliUserEmail, runSanityCmdCommand, studioVersions} from './shared/environment'

describeCliTest('CLI: `sanity exec`', () => {
  describe.each(studioVersions)('%s', (version) => {
    const script = version === 'v2' ? 'script.js' : 'script.ts'

    testConcurrent('sanity exec', async () => {
      const result = await runSanityCmdCommand(version, ['exec', script])
      expect(result.stdout.trim()).toBe('{}')
      expect(result.code).toBe(0)
    })

    testConcurrent('sanity exec --with-user-token', async () => {
      const result = await runSanityCmdCommand(version, ['exec', script, '--with-user-token'])
      const user = JSON.parse(result.stdout.trim())
      expect(user.email).toBe(cliUserEmail)
      expect(result.code).toBe(0)
    })
  })
})
