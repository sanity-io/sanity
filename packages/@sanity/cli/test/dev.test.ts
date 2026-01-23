import {createHash} from 'node:crypto'
import {copyFile, readFile, stat, unlink} from 'node:fs/promises'
import path from 'node:path'

import getPort from 'get-port'
import {describe, expect, test} from 'vitest'

import {describeCliTest} from './shared/describe'
import {testServerCommand} from './shared/devServer'
import {fixturesPath, studioNames, studiosPath} from './shared/environment'

describeCliTest('CLI: `sanity dev`', () => {
  describe.each(studioNames)('%s', (studioName) => {
    test('start', async () => {
      const port = await getPort()
      const basePath = '/config-base-path'
      const expectedFiles = [
        '/favicon.ico',
        `${basePath}/static/favicon.ico`,
        `${basePath}/static/favicon.svg`,
      ]

      const {html: startHtml, fileHashes} = await testServerCommand({
        command: 'dev',
        port,
        args: ['--port', `${port}`],
        cwd: path.join(studiosPath, studioName),
        basePath,
        expectedTitle: 'Sanity Studio',
        expectedFiles,
        expectedOutput: ({stdout}) => {
          expect(stdout).toContain('running at http://localhost')

          // Verify schema extraction message is _not_ printed when not enabled
          expect(stdout).not.toContain('Running dev server with schema extraction enabled')
        },
      })

      expect(startHtml).toContain('id="sanity"')

      for (const file of expectedFiles) {
        expect(fileHashes.get(file)).not.toBe(null)
      }

      // Check that the custom favicon is used if present, not the default one
      if (fileHashes.has(`${basePath}/static/favicon.svg`)) {
        const customFaviconHash = createHash('sha256')
          .update(await readFile(path.join(studiosPath, studioName, 'static', 'favicon.svg')))
          .digest('hex')
        expect(fileHashes.get(`${basePath}/static/favicon.svg`)).toBe(customFaviconHash)
      }
    }, 60_000)

    test('start with custom document component', async () => {
      const port = await getPort()
      const {html: startHtml} = await testServerCommand({
        command: 'dev',
        port,
        basePath: '/config-base-path',
        args: ['--port', `${port}`],
        cwd: path.join(studiosPath, `${studioName}-custom-document`),
        expectedTitle: 'Sanity Studio w/ custom document',
      })
      expect(startHtml).toContain('id="sanity"')

      // Check the use of environment variables from dotfiles
      expect(startHtml).toContain('data-studio-mode="development"')
      expect(startHtml).toContain('data-studio-dataset="ds-development"')
    }, 60_000)

    test('start with custom document component, in prod mode', async () => {
      const port = await getPort()
      const {html: startHtml} = await testServerCommand({
        command: 'dev',
        port,
        basePath: '/config-base-path',
        args: ['--port', `${port}`],
        env: {SANITY_ACTIVE_ENV: 'production'},
        cwd: path.join(studiosPath, `${studioName}-custom-document`),
        expectedTitle: 'Sanity Studio w/ custom document',
      })
      expect(startHtml).toContain('id="sanity"')

      // Check the use of environment variables from dotfiles
      expect(startHtml).toContain('data-studio-mode="production"')
      expect(startHtml).toContain('data-studio-dataset="ds-production"')
    }, 60_000)

    test('start with load-in-dashboard flag', async () => {
      const port = await getPort()
      await testServerCommand({
        command: 'dev',
        port,
        basePath: '/config-base-path',
        args: ['--port', `${port}`, '--load-in-dashboard'],
        cwd: path.join(studiosPath, studioName),
        expectedTitle: 'Sanity Studio',
        expectedOutput: ({stdout, stderr}) => {
          // Verify that the dashboard URL is printed
          expect(stdout).toContain('View your app in the Sanity dashboard here:')
          expect(stdout).toMatch(/https:\/\/(?:www\.)?(?:sanity\.io|sanity\.work)\/@/g)
          expect(stdout).toContain(`http%3A%2F%2Flocalhost%3A${port}`)
        },
      })
    }, 60_000)

    test('start with app', async () => {
      const port = await getPort()
      await testServerCommand({
        command: 'dev',
        port: port,
        basePath: '/app-base-path',
        args: ['--port', `${port}`],
        cwd: path.join(fixturesPath, 'app'),
        expectedTitle: 'Sanity Custom App',
        expectedOutput: ({stdout, stderr}) => {
          // Verify that the dashboard URL is printed
          expect(stdout).toContain('View your app in the Sanity dashboard here:')
          expect(stdout).toMatch(/https:\/\/(?:www\.)?(?:sanity\.io|sanity\.work)\/@/)
          expect(stdout).toContain(`http%3A%2F%2Flocalhost%3A${port}`)
        },
      })
    }, 60_000)

    test.each([
      {title: 'relative paths', absolute: false},
      {title: 'absolute paths', absolute: true},
    ])(
      'start with typegen with $title',
      async ({absolute}) => {
        const port = await getPort()

        const studioDir = path.join(studiosPath, studioName)
        const randomId = Math.random().toString(36).slice(2)
        const schemaPath = path.join(studioDir, `${randomId}schema.json`)
        const outputPath = path.join(studioDir, `${randomId}.types.ts`)

        // Copy working-schema.json to schema.json for typegen to use
        await copyFile(path.join(studioDir, 'working-schema.json'), schemaPath)

        try {
          await testServerCommand({
            command: 'dev',
            port,
            args: ['--port', `${port}`],
            cwd: studioDir,
            env: {
              SANITY_CLI_TEST_TYPEGEN: '1',
              SANITY_CLI_TEST_TYPEGEN_SCHEMA_PATH: absolute
                ? schemaPath
                : path.basename(schemaPath),
              SANITY_CLI_TEST_TYPEGEN_OUTPUT_PATH: absolute
                ? outputPath
                : path.basename(outputPath),
            },
            basePath: '/config-base-path',
            expectedTitle: 'Sanity Studio',
            expectedOutput: ({stdout, stderr}) => {
              // Verify typegen enabled message is printed
              expect(stdout).toContain('Typegen enabled. Watching:')

              // Verify generation output
              expect(stdout + stderr).toContain('Generated types to')
            },
          })

          // Assert that the output file was created
          await expect(stat(outputPath)).resolves.toBeTruthy()
        } finally {
          // Clean up created files
          await unlink(schemaPath).catch(() => {})
          await unlink(outputPath).catch(() => {})
        }
      },
      90_000,
    )

    test('start with schema extraction', async () => {
      const port = await getPort()
      const randomSchemaName = `${Math.random().toString(30).slice(2)}.json`

      await testServerCommand({
        command: 'dev',
        port,
        args: ['--port', `${port}`],
        cwd: path.join(studiosPath, studioName),
        env: {
          SANITY_CLI_TEST_SCHEMA_EXTRACTION: '1',
          SANITY_CLI_TEST_SCHEMA_EXTRACTION_PATH: randomSchemaName,
        },
        basePath: '/config-base-path',
        expectedTitle: 'Sanity Studio',
        expectedOutput: ({stdout, stderr}) => {
          // Verify schema extraction message is _not_ printed when not enabled
          expect(stdout).toContain('Running dev server with schema extraction enabled')

          expect(stdout + stderr).toContain(`Extracted schema to ${randomSchemaName}`)
        },
      })

      // Assert that the
      await expect(stat(path.join(studiosPath, studioName, randomSchemaName))).resolves.toBeTruthy()
    }, 60_000)
  })
})
