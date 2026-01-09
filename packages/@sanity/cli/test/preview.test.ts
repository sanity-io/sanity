import path from 'node:path'

import {describe, expect} from 'vitest'

import {describeCliTest, testConcurrent} from './shared/describe'
import {testServerCommand} from './shared/devServer'
import {runSanityCmdCommand, studioNames, studiosPath} from './shared/environment'

describeCliTest('CLI: `sanity preview`', () => {
  describe.each(studioNames)('%s', (name) => {
    testConcurrent('preview (no basepath)', async () => {
      const {html: previewHtml} = await testServerCommand({
        command: 'preview',
        args: ['--port', '3330', '../../static'],
        basePath: '/',
        port: 3330,
        cwd: path.join(studiosPath, name),
        expectedTitle: 'Sanity Static',
        expectedOutput: ({stderr}) => {
          expect(stderr).toContain('Could not determine base path from index.html') // Warning
        },
      })
      expect(previewHtml).toContain('<h1>This is static.</h1>')
    })

    testConcurrent('preview (infers basepath)', async () => {
      const {html: previewHtml} = await testServerCommand({
        command: 'preview',
        args: ['--port', '3456', '../../static-basepath'],
        basePath: '/some-base-path',
        port: 3456,
        cwd: path.join(studiosPath, name),
        expectedTitle: 'Sanity Static, Base Pathed',
        expectedOutput: ({stdout}) => {
          expect(stdout).toContain('Using resolved base path from static build')
          expect(stdout).toContain('/some-base-path')
          expect(stdout).toContain(':3456/some-base-path')
        },
      })

      expect(previewHtml).toContain('<h1>This is static, served from a base path.</h1>')
    })

    testConcurrent('preview (root basepath)', async () => {
      const {html: previewHtml} = await testServerCommand({
        command: 'preview',
        args: ['--port', '3457', '../../static-root-basepath'],
        basePath: '/',
        port: 3457,
        cwd: path.join(studiosPath, name),
        expectedTitle: 'Sanity Static',
      })
      expect(previewHtml).toContain('<h1>This is static, served from a root base path.</h1>')
    })

    testConcurrent('start (preview alias)', async () => {
      const {html: previewHtml} = await testServerCommand({
        command: 'start',
        args: ['--port', '3331', '../../static'],
        basePath: '/',
        port: 3331,
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
