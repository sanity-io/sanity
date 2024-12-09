import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import path from 'node:path'

import {describe, expect, test} from 'vitest'

import {describeCliTest} from './shared/describe'
import {testServerCommand} from './shared/devServer'
import {getTestRunArgs, studiosPath, studioVersions} from './shared/environment'

describeCliTest('CLI: `sanity dev`', () => {
  describe.each(studioVersions)('%s', (version) => {
    test('start', async () => {
      const testRunArgs = getTestRunArgs(version)
      const basePath = '/config-base-path'
      const expectedFiles = [
        '/favicon.ico',
        `${basePath}/static/favicon.ico`,
        `${basePath}/static/favicon.svg`,
      ]

      const {html: startHtml, fileHashes} = await testServerCommand({
        command: 'dev',
        port: testRunArgs.port,
        args: ['--port', `${testRunArgs.port}`],
        cwd: path.join(studiosPath, version),
        basePath,
        expectedTitle: 'Sanity Studio',
        expectedFiles,
      })

      expect(startHtml).toContain('id="sanity"')

      for (const file of expectedFiles) {
        expect(fileHashes.get(file)).not.toBe(null)
      }

      // Check that the custom favicon is used if present, not the default one
      if (fileHashes.has(`${basePath}/static/favicon.svg`)) {
        const customFaviconHash = createHash('sha256')
          .update(await readFile(path.join(studiosPath, version, 'static', 'favicon.svg')))
          .digest('hex')
        expect(fileHashes.get(`${basePath}/static/favicon.svg`)).toBe(customFaviconHash)
      }
    })

    test('start with custom document component', async () => {
      const testRunArgs = getTestRunArgs(version)
      const {html: startHtml} = await testServerCommand({
        command: 'dev',
        port: testRunArgs.port - 1,
        basePath: '/config-base-path',
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
      const testRunArgs = getTestRunArgs(version)
      const {html: startHtml} = await testServerCommand({
        command: 'dev',
        port: testRunArgs.port - 2,
        basePath: '/config-base-path',
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
