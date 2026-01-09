import path from 'node:path'

import {describe, expect} from 'vitest'

import {describeCliTest, testConcurrent} from './shared/describe'
import {getCliUserEmail, runSanityCmdCommand, studioNames} from './shared/environment'

describeCliTest('CLI: basic commands', () => {
  describe.each(studioNames)('%s', (studioName) => {
    testConcurrent('codemod', async () => {
      const result = await runSanityCmdCommand(studioName, ['codemod'])
      expect(result.stdout).toContain('Available code modifications')
      expect(result.code).toBe(0)
    })

    testConcurrent('debug', async () => {
      const result = await runSanityCmdCommand(studioName, ['debug'])
      expect(result.stdout).toContain(
        `Email: \x1B[1m${(await getCliUserEmail()) || 'null'}\x1B[22m`,
      )
      expect(result.code).toBe(0)
    })

    testConcurrent('help', async () => {
      const result = await runSanityCmdCommand(studioName, ['help'])
      expect(result.stdout).toMatch(/usage:/i)
      expect(result.code).toBe(0)
    })

    testConcurrent('help (from subdirectory)', async () => {
      const result = await runSanityCmdCommand(studioName, ['help'], {
        cwd: (cwd) => path.join(cwd, 'components'),
      })
      expect(result.stdout).toContain('Not in project directory')
      expect(result.stdout).toMatch(/usage:/i)
      expect(result.code).toBe(0)
    })

    testConcurrent('projects list', async () => {
      const result = await runSanityCmdCommand(studioName, ['projects', 'list'])
      expect(result.stdout).toContain('https://www.sanity.io/manage/project/')
      expect(result.code).toBe(0)
    })

    testConcurrent('sanity users list', async () => {
      const result = await runSanityCmdCommand(studioName, ['users', 'list'])
      expect(result.stdout).toContain(
        'GitHub CI CLI tests (Robot)                                                     ',
      ) // name of CI user
      expect(result.code).toBe(0)
    })
  })
})
