import path from 'path'
import {describeCliTest, testConcurrent} from './shared/describe'
import {testServerCommand} from './shared/devServer'
import {studiosPath} from './shared/environment'

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
  })
})
