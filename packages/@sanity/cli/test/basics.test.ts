import path from 'node:path'

import {describe, expect} from 'vitest'

import {describeCliTest, testConcurrent} from './shared/describe'
import {getCliUserEmail, runSanityCmdCommand, studioVersions} from './shared/environment'

describeCliTest('CLI: basic commands', () => {
  describe.each(studioVersions)('%s', (version) => {
    testConcurrent('codemod', async () => {
      const result = await runSanityCmdCommand(version, ['codemod'])
      expect(result.stdout).toContain('Available code modifications')
      expect(result.code).toBe(0)
    })

    testConcurrent('debug', async () => {
      const result = await runSanityCmdCommand(version, ['debug'])
      expect(result.stdout).toContain(
        `Email: \x1B[1m${(await getCliUserEmail()) || 'null'}\x1B[22m`,
      )
      expect(result.code).toBe(0)
    })

    testConcurrent('help', async () => {
      const result = await runSanityCmdCommand(version, ['help'])
      expect(result.stdout).toMatch(/usage:/i)
      expect(result.code).toBe(0)
    })

    testConcurrent('help (from subdirectory)', async () => {
      const result = await runSanityCmdCommand(version, ['help'], {
        cwd: (cwd) => path.join(cwd, 'components'),
      })
      expect(result.stdout).toContain('Not in project directory')
      expect(result.stdout).toMatch(/usage:/i)
      expect(result.code).toBe(0)
    })

    testConcurrent('projects list', async () => {
      const result = await runSanityCmdCommand(version, ['projects', 'list'])
      expect(result.stdout).toContain('https://www.sanity.io/manage/project/')
      expect(result.code).toBe(0)
    })

    testConcurrent('sanity users list', async () => {
      const result = await runSanityCmdCommand(version, ['users', 'list'])
      expect(result.stdout).toContain('CLI Developers') // name of CI user
      expect(result.code).toBe(0)
    })

    testConcurrent('sanity --version', async () => {
      const result = await runSanityCmdCommand(version, ['--version'])
      // If the help text isn't returned, the result should only be one line with text
      expect(result.stdout.split('\n').filter((l) => l.length > 0)).toHaveLength(1)
      expect(result.code).toBe(0)
    })
  })
})
