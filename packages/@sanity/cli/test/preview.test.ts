import path from 'node:path'

import getPort from 'get-port'
import {describe, expect} from 'vitest'

import {describeCliTest, testConcurrent} from './shared/describe'
import {testServerCommand} from './shared/devServer'
import {runSanityCmdCommand, studioNames, studiosPath} from './shared/environment'

describeCliTest('CLI: `sanity preview`', () => {
  describe.each(studioNames)('%s', (name) => {
    testConcurrent('preview (no basepath)', async () => {
      const port = await getPort()
      const {html: previewHtml} = await testServerCommand({
        command: 'preview',
        args: ['--port', `${port}`, '../../static'],
        basePath: '/',
        port,
        cwd: path.join(studiosPath, name),
        expectedTitle: 'Sanity Static',
        expectedOutput: ({stderr}) => {
          expect(stderr).toContain('Could not determine base path from index.html') // Warning
        },
      })
      expect(previewHtml).toContain('<h1>This is static.</h1>')
    })

    testConcurrent('preview (infers basepath)', async () => {
      const port = await getPort()
      const {html: previewHtml} = await testServerCommand({
        command: 'preview',
        args: ['--port', `${port}`, '../../static-basepath'],
        basePath: '/some-base-path',
        port,
        cwd: path.join(studiosPath, name),
        expectedTitle: 'Sanity Static, Base Pathed',
        expectedOutput: ({stdout}) => {
          expect(stdout).toContain('Using resolved base path from static build')
          expect(stdout).toContain('/some-base-path')
          expect(stdout).toContain(`${port}/some-base-path`)
        },
      })

      expect(previewHtml).toContain('<h1>This is static, served from a base path.</h1>')
    })

    testConcurrent('preview (root basepath)', async () => {
      const port = await getPort()
      const {html: previewHtml} = await testServerCommand({
        command: 'preview',
        args: ['--port', `${port}`, '../../static-root-basepath'],
        basePath: '/',
        port,
        cwd: path.join(studiosPath, name),
        expectedTitle: 'Sanity Static',
      })
      expect(previewHtml).toContain('<h1>This is static, served from a root base path.</h1>')
    })

    testConcurrent('start (preview alias)', async () => {
      const port = await getPort()
      const {html: previewHtml} = await testServerCommand({
        command: 'start',
        args: ['--port', `${port}`, '../../static'],
        basePath: '/',
        port,
        cwd: path.join(studiosPath, name),
        expectedTitle: 'Sanity Static',
      })
      expect(previewHtml).toContain('<h1>This is static.</h1>')
    })

    testConcurrent('start (hint for new `dev` command)', () => {
      return expect(runSanityCmdCommand(name, ['start'])).rejects.toMatchObject({
        stderr: /.*(command is used to preview static builds).*(sanity dev).*/,
        code: 1,
      })
    })
  })
})
