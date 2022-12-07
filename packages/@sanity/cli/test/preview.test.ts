import path from 'path'
import {describeCliTest, testConcurrent} from './shared/describe'
import {testServerCommand} from './shared/devServer'
import {runSanityCmdCommand, studiosPath} from './shared/environment'

describeCliTest('CLI: `sanity preview`', () => {
  describe('v3', () => {
    testConcurrent('preview', async () => {
      const previewHtml = await testServerCommand({
        command: 'preview',
        args: ['--port', '3330', '../../static'],
        port: 3330,
        cwd: path.join(studiosPath, 'v3'),
        expectedTitle: 'Sanity Static',
      })
      expect(previewHtml).toContain('<h1>This is static.</h1>')
    })

    testConcurrent('start (preview alias)', async () => {
      const previewHtml = await testServerCommand({
        command: 'start',
        args: ['--port', '3331', '../../static'],
        port: 3331,
        cwd: path.join(studiosPath, 'v3'),
        expectedTitle: 'Sanity Static',
      })
      expect(previewHtml).toContain('<h1>This is static.</h1>')
    })

    // Disable this for now as this has become a prompt now.
    // testConcurrent('start (hint for new `dev` command)', async () => {
    //   const result = await runSanityCmdCommand('v3', ['start'])
    //   const error = result.stderr.trim()
    //   expect(error).toContain('`sanity start` aliases `sanity preview`')
    //   expect(error).toContain('to start the development server')
    // })
  })
})
