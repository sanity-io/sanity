import path from 'path'
import {readFile, readdir} from 'fs/promises'
import {runSanityCmdCommand, studiosPath, studioVersions} from './shared/environment'
import {describeCliTest, testConcurrent} from './shared/describe'

describeCliTest('CLI: `sanity build` / `sanity deploy`', () => {
  describe.each(studioVersions)('%s', (version) => {
    // Builds can take a bit of time with lots of concurrent tasks and slow CIs
    jest.setTimeout(120 * 1000)

    const studioPath = path.join(studiosPath, version)

    testConcurrent(
      'build',
      async () => {
        // Build to a different output directory to avoid conflicting with `sanity deploy`
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
          const jsPath =
            files.find((file) => file.startsWith('sanity.') && file.endsWith('.js')) || ''
          const cssPath = files.find((file) => file.endsWith('.css')) || ''
          const builtHtml = await readFile(path.join(studioPath, 'out/index.html'), 'utf8')
          const builtJs = await readFile(path.join(studioPath, 'out', 'static', jsPath), 'utf8')
          const builtCss = await readFile(path.join(studioPath, 'out', 'static', cssPath), 'utf8')
          expect(builtHtml).toContain('id="sanity"')
          expect(builtJs).toContain('Sanity Studio')
          expect(builtCss).toMatch(/background:\s*green/)
        }
      },
      120 * 1000
    )

    test.skip(
      'deploy',
      async () => {
        const result = await runSanityCmdCommand(version, ['deploy', '-y'])
        expect(result.stdout).toContain('deployed to')
        expect(result.code).toBe(0)
      },
      120 * 1000
    )
  })
})
