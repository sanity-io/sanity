import path from 'path'
import {readFile, readdir, stat} from 'fs/promises'
import {runSanityCmdCommand, studiosPath, studioVersions} from './shared/environment'
import {describeCliTest, testConcurrent} from './shared/describe'

describeCliTest('CLI: `sanity build` / `sanity deploy`', () => {
  describe.each(studioVersions)('%s', (version) => {
    const testConcurrentV3 = version === 'v3' ? testConcurrent : test.skip

    // Builds can take a bit of time with lots of concurrent tasks and slow CIs
    jest.setTimeout(240 * 1000)

    const studioPath = path.join(studiosPath, version)

    testConcurrent(
      'build',
      async () => {
        // Build to a different output directory to avoid conflicting with
        // `sanity deploy` / `sanity start` tests
        const envTestId = `actual-env-${Math.random().toString(36).slice(2)}`
        const result = await runSanityCmdCommand(version, ['build', 'out', '-y'], {
          env: {SANITY_STUDIO_FROM_ACTUAL_ENV: envTestId},
        })
        expect(result.code).toBe(0)

        // These _could_ theoretically change, but is unlikely to with v2 being in support mode
        if (version === 'v2') {
          const builtHtml = await readFile(path.join(studioPath, 'out/index.html'), 'utf8')
          const builtJs = await readFile(
            path.join(studioPath, 'out/static/js/app.bundle.js'),
            'utf8',
          )
          const builtCss = await readFile(path.join(studioPath, 'out/static/css/main.css'), 'utf8')
          expect(builtHtml).toContain('id="sanityBody"')
          expect(builtJs).toContain('Restoring Sanity Studio')
          expect(builtCss).toContain('Spinner_sanity')

          // `.env` behavior is different in v2 - only the environment file is used
          // (`.env.development` / `.env.production`) - not `.env`. Also, it always
          // defaults to `development` unless `SANITY_ACTIVE_ENV` or `NODE_ENV` is set
          expect(builtJs).not.toContain('this-should-never-be-used')
          expect(builtJs).toContain('this-should-be-development')
        } else if (version === 'v3') {
          const files = await readdir(path.join(studioPath, 'out', 'static'))
          const jsPath = files.find((file) => file.startsWith('sanity-') && file.endsWith('.js'))
          const cssPath = files.find((file) => file.endsWith('.css'))
          const jsFiles = files.filter((file) => file.endsWith('.js'))
          if (!jsPath) {
            throw new Error('Could not find Sanity JS entry file (sanity-[hash].js)')
          }

          if (!cssPath) {
            throw new Error('Could not find Sanity CSS entry file (-[hash].css)')
          }

          // Ensure favicons + web manifest
          expect(
            await stat(path.join(studioPath, 'out/favicon.ico')).catch(() => null),
          ).toBeTruthy()
          const favicons = files.filter((file) => /^favicon|^apple-touch-icon/.test(file))
          expect(favicons).toHaveLength(5)
          expect(files).toContain('manifest.webmanifest')

          const builtHtml = await readFile(path.join(studioPath, 'out', 'index.html'), 'utf8')
          const builtJs = await readFile(path.join(studioPath, 'out', 'static', jsPath), 'utf8')
          const builtCss = await readFile(path.join(studioPath, 'out', 'static', cssPath), 'utf8')
          expect(builtHtml).toContain('id="sanity"')
          expect(builtJs).toMatch(/getElementById\(['"]sanity['"]\)/)
          expect(builtCss).toMatch(/background:\s*green/)

          // Test for environment variable support - through dotenv
          // Because of chunk splitting, it's hard to know which JS file contains the string we
          // want, so we need to loop through the chunks and look for it
          let envFile: string | undefined
          for (const jsFile of jsFiles) {
            const content = await readFile(path.join(studioPath, 'out', 'static', jsFile), 'utf8')
            if (content.includes('data-env-from-')) {
              envFile = content
              break
            }
          }

          if (!envFile) {
            throw new Error('Could not find JS file containing environment variables')
          }

          // Test that values from actual environment variables are passed down
          expect(envFile).toContain(envTestId)

          // Test that .env file is loaded
          expect(envFile).toContain('set-in-dotenv')

          // Test that .env.production file is loaded
          expect(envFile).toContain('⏧ production')
        }
      },
      version === 'v3' ? 120 * 1000 : 240 * 1000,
    )

    testConcurrentV3(
      'build with base path environment variable',
      async () => {
        // Build to a different output directory to avoid conflicting with
        // `sanity deploy` / `sanity start` / `sanity build` tests
        const result = await runSanityCmdCommand(version, ['build', 'out-basepath', '-y'], {
          env: {SANITY_STUDIO_BASEPATH: '/custom-base-path'},
        })
        expect(result.code).toBe(0)

        const files = await readdir(path.join(studioPath, 'out-basepath', 'static'))
        const builtHtml = await readFile(
          path.join(studioPath, 'out-basepath', 'index.html'),
          'utf8',
        )
        const cssPath = files.find((file) => file.endsWith('.css'))

        expect(builtHtml).toContain('id="sanity"')
        expect(builtHtml).toContain('src="/custom-base-path/static/sanity')
        expect(builtHtml).toContain(`href="/custom-base-path/static/${cssPath}"`)
      },
      120 * 1000,
    )

    testConcurrentV3(
      'build with base path from config',
      async () => {
        const result = await runSanityCmdCommand(version, ['build', 'out-config', '-y'])
        expect(result.code).toBe(0)

        const builtHtml = await readFile(path.join(studioPath, 'out-config', 'index.html'), 'utf8')
        expect(builtHtml).toContain('id="sanity"')
        expect(builtHtml).toContain('src="/config-base-path/static/sanity')
      },
      120 * 1000,
    )

    testConcurrentV3(
      'build with base path from environment, overriding config file',
      async () => {
        const result = await runSanityCmdCommand(version, ['build', 'out-env', '-y'], {
          env: {SANITY_STUDIO_BASEPATH: '/env-base-path'},
        })
        expect(result.code).toBe(0)

        const builtHtml = await readFile(path.join(studioPath, 'out-env', 'index.html'), 'utf8')
        expect(builtHtml).toContain('id="sanity"')
        expect(builtHtml).toContain('src="/env-base-path/static/sanity')

        expect(result.stderr).toContain(
          `Overriding configured base path (/config-base-path) with value from environment variable (/env-base-path)`,
        )
      },
      120 * 1000,
    )

    testConcurrentV3(
      'build with custom document, and custom basepath',
      async () => {
        const customDocStudioPath = path.join(studiosPath, 'v3-custom-document')
        const result = await runSanityCmdCommand('v3-custom-document', ['build', '-y'], {
          env: {SANITY_STUDIO_BASEPATH: '/env-base-path'},
        })
        expect(result.code).toBe(0)

        const builtHtml = await readFile(
          path.join(customDocStudioPath, 'dist', 'index.html'),
          'utf8',
        )
        expect(builtHtml).toContain('id="sanity"')
        expect(builtHtml).toContain('src="/env-base-path/static/sanity')
        expect(builtHtml).toContain('id="sanity"')

        // Check the use of environment variables from dotfiles
        expect(builtHtml).toContain('data-studio-mode="production"')
        expect(builtHtml).toContain('data-studio-dataset="ds-production"')

        expect(result.stderr).toContain(
          `Overriding configured base path (/config-base-path) with value from environment variable (/env-base-path)`,
        )
      },
      120 * 1000,
    )

    test.skip(
      'deploy',
      async () => {
        // Build to different output directory to avoid conflicting with `sanity build`/`sanity start` tests
        const result = await runSanityCmdCommand(version, ['deploy', '-y'])
        expect(result.stdout).toContain('deployed to')
        expect(result.code).toBe(0)
      },
      120 * 1000,
    )
  })
})
