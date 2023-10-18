import path from 'path'
import {describeCliTest, testConcurrent} from './shared/describe'
import {testServerCommand} from './shared/devServer'
import {runSanityCmdCommand, studiosPath} from './shared/environment'

describeCliTest('CLI: `sanity preview`', () => {
  describe('v3', () => {
    testConcurrent('preview (no basepath)', async () => {
      const {html: previewHtml, stderr} = await testServerCommand({
        command: 'preview',
        args: ['--port', '3330', '../../static'],
        port: 3330,
        cwd: path.join(studiosPath, 'v3'),
        expectedTitle: 'Sanity Static',
      })
      expect(previewHtml).toContain('<h1>This is static.</h1>')
      expect(stderr).toContain('Could not determine base path from index.html') // Warning
    })

    testConcurrent('preview (infers basepath)', async () => {
      const {html: previewHtml, stdout} = await testServerCommand({
        command: 'preview',
        args: ['--port', '3456', '../../static-basepath'],
        port: 3456,
        cwd: path.join(studiosPath, 'v3'),
        expectedTitle: 'Sanity Static, Base Pathed',
      })

      expect(previewHtml).toContain('<h1>This is static, served from a base path.</h1>')
      expect(stdout).toContain('Using resolved base path from static build')
      expect(stdout).toContain('/some-base-path')
      expect(stdout).toContain(':3456/some-base-path')
    })

    testConcurrent('preview (root basepath)', async () => {
      const {html: previewHtml} = await testServerCommand({
        command: 'preview',
        args: ['--port', '3457', '../../static-root-basepath'],
        port: 3457,
        cwd: path.join(studiosPath, 'v3'),
        expectedTitle: 'Sanity Static',
      })
      expect(previewHtml).toContain('<h1>This is static, served from a root base path.</h1>')
    })

    testConcurrent('start (preview alias)', async () => {
      const {html: previewHtml} = await testServerCommand({
        command: 'start',
        args: ['--port', '3331', '../../static'],
        port: 3331,
        cwd: path.join(studiosPath, 'v3'),
        expectedTitle: 'Sanity Static',
      })
      expect(previewHtml).toContain('<h1>This is static.</h1>')
    })

    testConcurrent('start (hint for new `dev` command)', () => {
      return expect(runSanityCmdCommand('v3', ['start'])).rejects.toMatchObject({
        stderr: /.*(command is used to preview static builds).*(sanity dev).*/,
        code: 1,
      })
    })
  })
})
