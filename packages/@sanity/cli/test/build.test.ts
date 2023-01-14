import path from 'path'
import {readFile, readdir} from 'fs/promises'
import {runSanityCmdCommand, studiosPath, studioVersions} from './shared/environment'
import {describeCliTest, testConcurrent} from './shared/describe'

describeCliTest('CLI: `sanity build` / `sanity deploy`', () => {
  describe.each(studioVersions)('%s', (version) => {
    const testConcurrentV3 = version === 'v3' ? testConcurrent : test.skip

    // Builds can take a bit of time with lots of concurrent tasks and slow CIs
    jest.setTimeout(120 * 1000)

    const studioPath = path.join(studiosPath, version)

    testConcurrent(
      'build',
      async () => {
        // Build to a different output directory to avoid conflicting with
        // `sanity deploy` / `sanity start` tests
        const result = await runSanityCmdCommand(version, ['build', 'out', '-y'])
        expect(result.code).toBe(0)

        // These _could_ theoretically change, but is unlikely to with v2 being in support mode
        if (version === 'v2') {
          const builtHtml = await readFile(path.join(studioPath, 'out/index.html'), 'utf8')
          const builtJs = await readFile(
            path.join(studioPath, 'out/static/js/app.bundle.js'),
            'utf8'
          )
          const builtCss = await readFile(path.join(studioPath, 'out/static/css/main.css'), 'utf8')
          expect(builtHtml).toContain('id="sanityBody"')
          expect(builtJs).toContain('Restoring Sanity Studio')
          expect(builtCss).toContain('Spinner_sanity')
        } else if (version === 'v3') {
          const files = await readdir(path.join(studioPath, 'out', 'static'))
          const jsPath = files.find((file) => file.startsWith('sanity-') && file.endsWith('.js'))
          const cssPath = files.find((file) => file.endsWith('.css'))
          if (!jsPath) {
            throw new Error('Could not find Sanity JS entry file (sanity-[hash].js)')
          }

          if (!cssPath) {
            throw new Error('Could not find Sanity CSS entry file (-[hash].css)')
          }

          const builtHtml = await readFile(path.join(studioPath, 'out', 'index.html'), 'utf8')
          const builtJs = await readFile(path.join(studioPath, 'out', 'static', jsPath), 'utf8')
          const builtCss = await readFile(path.join(studioPath, 'out', 'static', cssPath), 'utf8')
          expect(builtHtml).toContain('id="sanity"')
          expect(builtJs).toMatch(/getElementById\(['"]sanity['"]\)/)
          expect(builtCss).toMatch(/background:\s*green/)
        }
      },
      120 * 1000
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

        const builtHtml = await readFile(
          path.join(studioPath, 'out-basepath', 'index.html'),
          'utf8'
        )
        expect(builtHtml).toContain('id="sanity"')
        expect(builtHtml).toContain('src="/custom-base-path/static/sanity')
      },
      120 * 1000
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
      120 * 1000
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
          `Overriding configured base path (/config-base-path) with value from environment variable (/env-base-path)`
        )
      },
      120 * 1000
    )

    test.skip(
      'deploy',
      async () => {
        // Build to different output directory to avoid conflicting with `sanity build`/`sanity start` tests
        const result = await runSanityCmdCommand(version, ['deploy', '-y'])
        expect(result.stdout).toContain('deployed to')
        expect(result.code).toBe(0)
      },
      120 * 1000
    )
  })
})
