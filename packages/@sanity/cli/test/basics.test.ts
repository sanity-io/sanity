import {describeCliTest, testConcurrent} from './shared/describe'
import {cliUserEmail, runSanityCmdCommand, studioVersions} from './shared/environment'

describeCliTest('CLI: basic commands', () => {
  describe.each(studioVersions)('%s', (version) => {
    testConcurrent('codemod', async () => {
      const result = await runSanityCmdCommand(version, ['codemod'])
      expect(result.stdout).toContain('Available code modifications')
      expect(result.code).toBe(0)
    })

    testConcurrent('debug', async () => {
      const result = await runSanityCmdCommand(version, ['debug'])
      expect(result.stdout).toContain(cliUserEmail)
      expect(result.code).toBe(0)
    })

    testConcurrent('help', async () => {
      const result = await runSanityCmdCommand(version, ['help'])
      expect(result.stdout).toMatch(/usage:/i)
      expect(result.code).toBe(0)
    })

    testConcurrent('projects list', async () => {
      const result = await runSanityCmdCommand(version, ['projects', 'list'])
      expect(result.stdout).toContain('.sanity.studio')
      expect(result.code).toBe(0)
    })

    testConcurrent('sanity users list', async () => {
      const result = await runSanityCmdCommand(version, ['users', 'list'])
      expect(result.stdout).toContain('Continous Integration') // name of CI user
      expect(result.code).toBe(0)
    })
  })
})
