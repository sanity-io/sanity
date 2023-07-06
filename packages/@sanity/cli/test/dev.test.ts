import path from 'path'
import {createHash} from 'crypto'
import {readFile} from 'fs/promises'
import {describeCliTest} from './shared/describe'
import {testServerCommand} from './shared/devServer'
import {getTestRunArgs, studiosPath, studioVersions} from './shared/environment'

describeCliTest('CLI: `sanity dev`', () => {
  describe.each(studioVersions)('%s', (version) => {
    test('start', async () => {
      const testRunArgs = getTestRunArgs(version)
      const expectedFiles =
        version === 'v2' ? [] : ['static/favicon.ico', 'favicon.ico', 'static/favicon.svg']

      const {html: startHtml, fileHashes} = await testServerCommand({
        command: version === 'v2' ? 'start' : 'dev',
        port: testRunArgs.port,
        cwd: path.join(studiosPath, version),
        expectedTitle: version === 'v2' ? `${version} studio` : 'Sanity Studio',
        expectedFiles,
      })

      expect(startHtml).toContain(version === 'v2' ? 'id="sanityBody"' : 'id="sanity"')

      for (const file of expectedFiles) {
        expect(fileHashes.get(file)).not.toBe(null)
      }

      if (fileHashes.has('static/favicon.svg')) {
        const faviconHash = createHash('sha256')
          .update(await readFile(path.join(studiosPath, version, 'static', 'favicon.svg')))
          .digest('hex')
        expect(fileHashes.get('static/favicon.svg')).toBe(faviconHash)
      }
    })

    test('start with custom document component', async () => {
      if (version === 'v2') {
        return
      }

      const testRunArgs = getTestRunArgs(version)
      const {html: startHtml} = await testServerCommand({
        command: 'dev',
        port: testRunArgs.port - 1,
        args: ['--port', `${testRunArgs.port - 1}`],
        cwd: path.join(studiosPath, `${version}-custom-document`),
        expectedTitle: 'Sanity Studio w/ custom document',
      })
      expect(startHtml).toContain('id="sanity"')

      // Check the use of environment variables from dotfiles
      expect(startHtml).toContain('data-studio-mode="development"')
      expect(startHtml).toContain('data-studio-dataset="ds-development"')
    })

    test('start with custom document component, in prod mode', async () => {
      if (version === 'v2') {
        return
      }

      const testRunArgs = getTestRunArgs(version)
      const {html: startHtml} = await testServerCommand({
        command: 'dev',
        port: testRunArgs.port - 2,
        args: ['--port', `${testRunArgs.port - 2}`],
        env: {SANITY_ACTIVE_ENV: 'production'},
        cwd: path.join(studiosPath, `${version}-custom-document`),
        expectedTitle: 'Sanity Studio w/ custom document',
      })
      expect(startHtml).toContain('id="sanity"')

      // Check the use of environment variables from dotfiles
      expect(startHtml).toContain('data-studio-mode="production"')
      expect(startHtml).toContain('data-studio-dataset="ds-production"')
    })
  })
})
