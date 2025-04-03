import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import path from 'node:path'

import {describe, expect, test} from 'vitest'

import {describeCliTest} from './shared/describe'
import {testServerCommand} from './shared/devServer'
import {fixturesPath, getTestRunArgs, studiosPath, studioVersions} from './shared/environment'

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

    test('start with load-in-dashboard flag', async () => {
      const testRunArgs = getTestRunArgs(version)
      const {stdout} = await testServerCommand({
        command: 'dev',
        port: testRunArgs.port - 3,
        basePath: '/config-base-path',
        args: ['--port', `${testRunArgs.port - 3}`, '--load-in-dashboard'],
        cwd: path.join(studiosPath, version),
        expectedTitle: 'Sanity Studio',
      })

      // Verify that the dashboard URL is printed
      expect(stdout).toContain('View your app in the Sanity dashboard here:')
      expect(stdout).toMatch(/https:\/\/(?:www\.)?(?:sanity\.io|sanity\.work)\/@/)
      expect(stdout).toContain(`http%3A%2F%2Flocalhost%3A${testRunArgs.port - 3}`)
    })

    test('start with app', async () => {
      const testRunArgs = getTestRunArgs(version)
      const port = testRunArgs.port - 4
      const {stdout} = await testServerCommand({
        command: 'dev',
        port: port,
        basePath: '/app-base-path',
        args: ['--port', `${port}`],
        cwd: path.join(fixturesPath, 'app'),
        expectedTitle: 'Sanity CORE App',
      })

      // Verify that the dashboard URL is printed
      expect(stdout).toContain('View your app in the Sanity dashboard here:')
      expect(stdout).toMatch(/https:\/\/(?:www\.)?(?:sanity\.io|sanity\.work)\/@/)
      expect(stdout).toContain(`http%3A%2F%2Flocalhost%3A${port}`)
    })
  })
})
